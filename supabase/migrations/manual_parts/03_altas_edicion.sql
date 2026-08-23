-- ============================================================================
-- 5. ALTAS (crean o reasignan reutilizando la misma fila de individuals)
-- ============================================================================

-- Reactivacion de cuenta (punto 2): si p_profile_id es NULL, se reutiliza la
-- cuenta previamente linkeada a este dirigente (si tenia una) — nunca se crea
-- una cuenta nueva de forma implicita desde esta funcion. Crear una cuenta
-- nueva es una decision explicita de la capa de aplicacion (Admin API de
-- Supabase Auth, fuera de esta base), que luego pasa su profile_id aca; en
-- ese caso la cuenta anterior queda desvinculada (nunca dos activas a la vez,
-- reforzado ademas por uq_leaders_profile_id).
create or replace function fn_create_leader(
  p_dni text, p_full_name text, p_phone text, p_profile_id uuid default null,
  p_ip text default null, p_user_agent text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  ctx              record;
  v_dni            text;
  v_ind            individuals%rowtype;
  v_old_profile    uuid;
  v_target_profile uuid;
  v_is_reassign    boolean := false;
begin
  select * into ctx from fn_require_profile();
  if ctx.role <> 'superadmin' then
    raise exception 'No autorizado';
  end if;

  if p_profile_id is not null
     and (select organization_id from profiles where id = p_profile_id) is distinct from ctx.organization_id then
    raise exception 'No autorizado';
  end if;

  v_dni := fn_normalize_dni(p_dni);
  select * into v_ind from individuals
    where organization_id = ctx.organization_id and dni_normalized = v_dni for update;

  if found and v_ind.status = 'active' then
    raise exception 'DNI_BLOCKED';
  end if;

  if found then
    v_is_reassign := true;
    update individuals set full_name = p_full_name, phone = p_phone,
      status = 'active', position = 'leader', updated_at = now()
      where id = v_ind.id;
    select profile_id into v_old_profile from leaders where id = v_ind.id;
  else
    insert into individuals(organization_id, dni_normalized, dni_display, full_name, phone, position, status)
      values (ctx.organization_id, v_dni, p_dni, p_full_name, p_phone, 'leader', 'active')
      returning * into v_ind;
    v_old_profile := null;
  end if;

  if p_profile_id is not null and exists (
    select 1 from leaders where profile_id = p_profile_id and id <> v_ind.id
  ) then
    raise exception 'PROFILE_ALREADY_LINKED';
  end if;

  v_target_profile := coalesce(p_profile_id, v_old_profile);

  insert into leaders(id, profile_id, created_by)
    values (v_ind.id, v_target_profile, ctx.profile_id)
  on conflict (id) do update set
    is_removed = false, removed_at = null, removed_by = null, removed_reason = null,
    access_status = 'active', profile_id = v_target_profile;

  -- Se reemplazo explicitamente la cuenta: desvincular la vieja para que nunca
  -- queden dos perfiles apuntando al mismo dirigente.
  if v_old_profile is not null and p_profile_id is not null and p_profile_id <> v_old_profile then
    update profiles set leader_id = null where id = v_old_profile;
  end if;

  if v_target_profile is not null then
    update profiles set leader_id = v_ind.id where id = v_target_profile;
  end if;

  perform fn_write_audit(
    case when v_is_reassign then 'REASSIGN_LEADER' else 'CREATE_LEADER' end,
    'leader', v_ind.id, v_ind.id, null, null,
    case when v_is_reassign then jsonb_build_object('previous_profile_id', v_old_profile) else null end,
    jsonb_build_object('full_name', p_full_name, 'dni', v_dni, 'profile_id', v_target_profile),
    p_ip, p_user_agent
  );

  return v_ind.id;
end;
$$;

create or replace function fn_create_pointer(
  p_leader_id uuid, p_dni text, p_full_name text, p_phone text,
  p_ip text default null, p_user_agent text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  ctx           record;
  v_dni         text;
  v_ind         individuals%rowtype;
  v_is_reassign boolean := false;
begin
  select * into ctx from fn_require_profile();

  if ctx.role not in ('leader', 'superadmin') then
    raise exception 'No autorizado';
  end if;
  if fn_individual_org(p_leader_id) is distinct from ctx.organization_id then
    raise exception 'No autorizado';
  end if;
  if ctx.role = 'leader' and ctx.leader_id <> p_leader_id then
    raise exception 'No autorizado';
  end if;
  if not fn_can_leader_write(ctx.organization_id) then
    raise exception 'CARGA_CERRADA';
  end if;

  v_dni := fn_normalize_dni(p_dni);
  select * into v_ind from individuals
    where organization_id = ctx.organization_id and dni_normalized = v_dni for update;

  if found and v_ind.status = 'active' then
    raise exception 'DNI_BLOCKED';
  end if;

  if found then
    v_is_reassign := true;
    update individuals set full_name = p_full_name, phone = p_phone,
      status = 'active', position = 'pointer', updated_at = now()
      where id = v_ind.id;
  else
    insert into individuals(organization_id, dni_normalized, dni_display, full_name, phone, position, status)
      values (ctx.organization_id, v_dni, p_dni, p_full_name, p_phone, 'pointer', 'active')
      returning * into v_ind;
  end if;

  insert into pointers(id, leader_id, created_by)
    values (v_ind.id, p_leader_id, ctx.profile_id)
  on conflict (id) do update set
    is_removed = false, removed_at = null, removed_by = null, removed_reason = null,
    leader_id = p_leader_id;

  perform fn_write_audit(
    case when v_is_reassign then 'REASSIGN_POINTER' else 'CREATE_POINTER' end,
    'pointer', v_ind.id, p_leader_id, v_ind.id, null,
    null, jsonb_build_object('full_name', p_full_name, 'dni', v_dni),
    p_ip, p_user_agent
  );

  return v_ind.id;
end;
$$;

create or replace function fn_create_person(
  p_pointer_id uuid, p_dni text, p_full_name text, p_phone text,
  p_ip text default null, p_user_agent text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  ctx           record;
  v_ptr         pointers%rowtype;
  v_dni         text;
  v_ind         individuals%rowtype;
  v_is_reassign boolean := false;
begin
  select * into ctx from fn_require_profile();

  select * into v_ptr from pointers where id = p_pointer_id and is_removed = false;
  if not found then
    raise exception 'No autorizado';
  end if;
  if fn_individual_org(p_pointer_id) is distinct from ctx.organization_id then
    raise exception 'No autorizado';
  end if;
  if ctx.role = 'leader' and v_ptr.leader_id <> ctx.leader_id then
    raise exception 'No autorizado';
  end if;
  if not fn_can_leader_write(ctx.organization_id) then
    raise exception 'CARGA_CERRADA';
  end if;

  v_dni := fn_normalize_dni(p_dni);
  select * into v_ind from individuals
    where organization_id = ctx.organization_id and dni_normalized = v_dni for update;

  if found and v_ind.status = 'active' then
    raise exception 'DNI_BLOCKED';
  end if;

  if found then
    v_is_reassign := true;
    update individuals set full_name = p_full_name, phone = p_phone,
      status = 'active', position = 'person', updated_at = now()
      where id = v_ind.id;
  else
    insert into individuals(organization_id, dni_normalized, dni_display, full_name, phone, position, status)
      values (ctx.organization_id, v_dni, p_dni, p_full_name, p_phone, 'person', 'active')
      returning * into v_ind;
  end if;

  insert into registered_people(id, pointer_id, created_by)
    values (v_ind.id, p_pointer_id, ctx.profile_id)
  on conflict (id) do update set
    is_removed = false, removed_at = null, removed_by = null, removed_reason = null,
    pointer_id = p_pointer_id;

  perform fn_write_audit(
    case when v_is_reassign then 'REASSIGN_PERSON' else 'CREATE_PERSON' end,
    'person', v_ind.id, v_ptr.leader_id, p_pointer_id, v_ind.id,
    null, jsonb_build_object('full_name', p_full_name, 'dni', v_dni),
    p_ip, p_user_agent
  );

  return v_ind.id;
end;
$$;

-- ============================================================================
-- 6. EDICION (nombre/telefono; el DNI no se edita: es la identidad)
-- ============================================================================

create or replace function fn_update_leader(p_leader_id uuid, p_full_name text, p_phone text,
  p_ip text default null, p_user_agent text default null)
returns void language plpgsql security definer set search_path = public as $$
declare ctx record; v_before individuals%rowtype;
begin
  select * into ctx from fn_require_profile();
  if ctx.role <> 'superadmin' then raise exception 'No autorizado'; end if;
  if fn_individual_org(p_leader_id) is distinct from ctx.organization_id then raise exception 'No autorizado'; end if;

  select * into v_before from individuals where id = p_leader_id;
  update individuals set full_name = p_full_name, phone = p_phone, updated_at = now() where id = p_leader_id;
  perform fn_write_audit('UPDATE_LEADER', 'leader', p_leader_id, p_leader_id, null, null,
    jsonb_build_object('full_name', v_before.full_name, 'phone', v_before.phone),
    jsonb_build_object('full_name', p_full_name, 'phone', p_phone), p_ip, p_user_agent);
end;
$$;

create or replace function fn_update_pointer(p_pointer_id uuid, p_full_name text, p_phone text,
  p_ip text default null, p_user_agent text default null)
returns void language plpgsql security definer set search_path = public as $$
declare ctx record; v_ptr pointers%rowtype; v_before individuals%rowtype;
begin
  select * into ctx from fn_require_profile();
  select * into v_ptr from pointers where id = p_pointer_id and is_removed = false;
  if not found then raise exception 'No autorizado'; end if;
  if fn_individual_org(p_pointer_id) is distinct from ctx.organization_id then raise exception 'No autorizado'; end if;
  if ctx.role = 'leader' and v_ptr.leader_id <> ctx.leader_id then raise exception 'No autorizado'; end if;
  if not fn_can_leader_write(ctx.organization_id) then raise exception 'CARGA_CERRADA'; end if;

  select * into v_before from individuals where id = p_pointer_id;
  update individuals set full_name = p_full_name, phone = p_phone, updated_at = now() where id = p_pointer_id;
  perform fn_write_audit('UPDATE_POINTER', 'pointer', p_pointer_id, v_ptr.leader_id, p_pointer_id, null,
    jsonb_build_object('full_name', v_before.full_name, 'phone', v_before.phone),
    jsonb_build_object('full_name', p_full_name, 'phone', p_phone), p_ip, p_user_agent);
end;
$$;

create or replace function fn_update_person(p_person_id uuid, p_full_name text, p_phone text,
  p_ip text default null, p_user_agent text default null)
returns void language plpgsql security definer set search_path = public as $$
declare ctx record; v_rp registered_people%rowtype; v_ptr pointers%rowtype; v_before individuals%rowtype;
begin
  select * into ctx from fn_require_profile();
  select * into v_rp from registered_people where id = p_person_id and is_removed = false;
  if not found then raise exception 'No autorizado'; end if;
  if fn_individual_org(p_person_id) is distinct from ctx.organization_id then raise exception 'No autorizado'; end if;
  select * into v_ptr from pointers where id = v_rp.pointer_id;
  if ctx.role = 'leader' and v_ptr.leader_id <> ctx.leader_id then raise exception 'No autorizado'; end if;
  if not fn_can_leader_write(ctx.organization_id) then raise exception 'CARGA_CERRADA'; end if;

  select * into v_before from individuals where id = p_person_id;
  update individuals set full_name = p_full_name, phone = p_phone, updated_at = now() where id = p_person_id;
  perform fn_write_audit('UPDATE_PERSON', 'person', p_person_id, v_ptr.leader_id, v_ptr.id, p_person_id,
    jsonb_build_object('full_name', v_before.full_name, 'phone', v_before.phone),
    jsonb_build_object('full_name', p_full_name, 'phone', p_phone), p_ip, p_user_agent);
end;
$$;

create or replace function fn_update_vehicle(p_vehicle_id uuid, p_type vehicle_type, p_plate text,
  p_driver_full_name text, p_driver_dni text, p_driver_phone text,
  p_ip text default null, p_user_agent text default null)
returns void language plpgsql security definer set search_path = public as $$
declare ctx record; v vehicles%rowtype; v_plate text;
begin
  select * into ctx from fn_require_profile();
  select * into v from vehicles where id = p_vehicle_id and is_removed = false;
  if not found then raise exception 'No autorizado'; end if;
  if v.organization_id <> ctx.organization_id then raise exception 'No autorizado'; end if;
  if ctx.role = 'leader' and v.leader_id <> ctx.leader_id then raise exception 'No autorizado'; end if;
  if not fn_can_leader_write(ctx.organization_id) then raise exception 'CARGA_CERRADA'; end if;

  v_plate := upper(regexp_replace(p_plate, '[^A-Za-z0-9]', '', 'g'));
  if v_plate <> v.plate_normalized and exists (
    select 1 from vehicles where organization_id = v.organization_id
      and plate_normalized = v_plate and is_removed = false
  ) then
    raise exception 'PLATE_BLOCKED';
  end if;

  update vehicles set type = p_type, plate_normalized = v_plate, plate_display = p_plate,
    driver_full_name = p_driver_full_name, driver_dni_normalized = fn_normalize_dni(p_driver_dni),
    driver_phone = p_driver_phone
    where id = p_vehicle_id;

  perform fn_write_audit('UPDATE_VEHICLE', 'vehicle', p_vehicle_id, v.leader_id, null, null,
    jsonb_build_object('plate', v.plate_display), jsonb_build_object('plate', p_plate), p_ip, p_user_agent);
end;
$$;

create or replace function fn_create_vehicle(
  p_leader_id uuid, p_type vehicle_type, p_plate text,
  p_driver_full_name text, p_driver_dni text, p_driver_phone text,
  p_ip text default null, p_user_agent text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  ctx     record;
  v_plate text;
  v_id    uuid;
begin
  select * into ctx from fn_require_profile();
  if fn_individual_org(p_leader_id) is distinct from ctx.organization_id then
    raise exception 'No autorizado';
  end if;
  if ctx.role = 'leader' and ctx.leader_id <> p_leader_id then
    raise exception 'No autorizado';
  end if;
  if not fn_can_leader_write(ctx.organization_id) then
    raise exception 'CARGA_CERRADA';
  end if;

  v_plate := upper(regexp_replace(p_plate, '[^A-Za-z0-9]', '', 'g'));
  if exists (
    select 1 from vehicles where organization_id = ctx.organization_id
      and plate_normalized = v_plate and is_removed = false
  ) then
    raise exception 'PLATE_BLOCKED';
  end if;

  insert into vehicles(
    organization_id, leader_id, type, plate_normalized, plate_display,
    driver_full_name, driver_dni_normalized, driver_phone, created_by
  ) values (
    ctx.organization_id, p_leader_id, p_type, v_plate, p_plate,
    p_driver_full_name, fn_normalize_dni(p_driver_dni), p_driver_phone, ctx.profile_id
  ) returning id into v_id;

  perform fn_write_audit('CREATE_VEHICLE', 'vehicle', v_id, p_leader_id, null, null,
    null, jsonb_build_object('plate', v_plate, 'driver', p_driver_full_name), p_ip, p_user_agent);

  return v_id;
end;
$$;

