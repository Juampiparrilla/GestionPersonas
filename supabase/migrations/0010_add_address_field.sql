-- ============================================================================
-- 0010 (parte 1/2): agrega el campo Direccion + las funciones de ALTA
--
-- Se dividio en dos archivos (0010 y 0011) porque el editor SQL de Supabase
-- corto la primera version de un solo archivo a mitad de pegado (paso muy
-- largo para pegar de una), lo que dejaba abierto el bloque de una funcion
-- sin su cierre correspondiente. Pegando en dos partes mas cortas es mas
-- facil verificar que entro completo.
--
-- Vive en `individuals` (igual que full_name/phone), porque es el mismo dato
-- de la persona sin importar que posicion ocupe. Se agrega como parametro
-- NUEVO al final de cada funcion de alta/edicion afectada. Postgres solo
-- permite `create or replace function` sin cambiar la "identidad" (lista de
-- TIPOS) de una funcion -- agregar un parametro, aunque tenga default,
-- cambia esa lista y crearia un OVERLOAD ambiguo en vez de reemplazar la
-- funcion existente (y PostgREST fallaria con "no pudo elegir la funcion"
-- cuando el llamado no manda p_address). Por eso cada funcion se DROPEA por
-- su firma vieja antes de recrearla con la firma nueva -- y, al ser
-- tecnicamente una funcion nueva para Postgres, hay que repetir el
-- revoke-de-anon + grant-a-authenticated (mismo gotcha de 0005) -- eso queda
-- al final de 0011, junto con las funciones de edicion.
-- ============================================================================

alter table individuals add column address text;

drop function if exists fn_create_leader(text, text, text, uuid, text, text);
create function fn_create_leader(
  p_dni text, p_full_name text, p_phone text, p_profile_id uuid default null,
  p_address text default null, p_ip text default null, p_user_agent text default null
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
    update individuals set full_name = p_full_name, phone = p_phone, address = p_address,
      status = 'active', position = 'leader', updated_at = now()
      where id = v_ind.id;
    select profile_id into v_old_profile from leaders where id = v_ind.id;
  else
    insert into individuals(organization_id, dni_normalized, dni_display, full_name, phone, address, position, status)
      values (ctx.organization_id, v_dni, p_dni, p_full_name, p_phone, p_address, 'leader', 'active')
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

drop function if exists fn_create_pointer(uuid, text, text, text, text, text);
create function fn_create_pointer(
  p_leader_id uuid, p_dni text, p_full_name text, p_phone text, p_address text default null,
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
    update individuals set full_name = p_full_name, phone = p_phone, address = p_address,
      status = 'active', position = 'pointer', updated_at = now()
      where id = v_ind.id;
  else
    insert into individuals(organization_id, dni_normalized, dni_display, full_name, phone, address, position, status)
      values (ctx.organization_id, v_dni, p_dni, p_full_name, p_phone, p_address, 'pointer', 'active')
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

drop function if exists fn_create_person(uuid, text, text, text, text, text);
create function fn_create_person(
  p_pointer_id uuid, p_dni text, p_full_name text, p_phone text, p_address text default null,
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
    update individuals set full_name = p_full_name, phone = p_phone, address = p_address,
      status = 'active', position = 'person', updated_at = now()
      where id = v_ind.id;
  else
    insert into individuals(organization_id, dni_normalized, dni_display, full_name, phone, address, position, status)
      values (ctx.organization_id, v_dni, p_dni, p_full_name, p_phone, p_address, 'person', 'active')
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

-- Se revoca de anon (y se deja explicito el grant a authenticated) aca
-- mismo, sin esperar a 0011, para no dejar ni un instante estas 3 funciones
-- nuevas ejecutables por un usuario sin sesion (gotcha de 0005).
revoke execute on function fn_create_leader(text, text, text, uuid, text, text, text) from anon;
revoke execute on function fn_create_pointer(uuid, text, text, text, text, text, text) from anon;
revoke execute on function fn_create_person(uuid, text, text, text, text, text, text) from anon;

grant execute on function fn_create_leader(text, text, text, uuid, text, text, text) to authenticated;
grant execute on function fn_create_pointer(uuid, text, text, text, text, text, text) to authenticated;
grant execute on function fn_create_person(uuid, text, text, text, text, text, text) to authenticated;
