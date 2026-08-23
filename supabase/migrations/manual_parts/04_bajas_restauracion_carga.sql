-- ============================================================================
-- 7. BAJAS LOGICAS (quitar) — nunca eliminan fisicamente
--
-- Nota sobre transaccionalidad (punto 5): cada una de estas funciones se
-- invoca como UNA sola sentencia SQL desde el cliente (`select fn_x(...)`).
-- Postgres ejecuta el cuerpo completo de la funcion dentro de esa misma
-- sentencia; si CUALQUIER paso interno lanza una excepcion (por ejemplo, una
-- violacion de FK o un `raise exception`), TODOS los efectos ya aplicados
-- dentro de la funcion se deshacen automaticamente junto con la sentencia
-- completa. No hay manejo manual de COMMIT/ROLLBACK ni bloques de excepcion
-- que absorban errores a mitad de camino, por lo que no existe un estado
-- intermedio posible: fn_remove_pointer, en particular, o libera a TODAS las
-- personas asociadas y marca el puntero como quitado, o no cambia nada.
-- ============================================================================

create or replace function fn_remove_person(p_person_id uuid, p_reason text default null,
  p_ip text default null, p_user_agent text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  ctx record;
  v_rp registered_people%rowtype;
  v_ptr pointers%rowtype;
begin
  select * into ctx from fn_require_profile();
  select * into v_rp from registered_people where id = p_person_id and is_removed = false;
  if not found then raise exception 'No autorizado'; end if;
  if fn_individual_org(p_person_id) is distinct from ctx.organization_id then raise exception 'No autorizado'; end if;
  select * into v_ptr from pointers where id = v_rp.pointer_id;

  if ctx.role = 'leader' and v_ptr.leader_id <> ctx.leader_id then
    raise exception 'No autorizado';
  end if;
  if not fn_can_leader_write(ctx.organization_id) then
    raise exception 'CARGA_CERRADA';
  end if;

  update registered_people set is_removed = true, removed_at = now(), removed_by = ctx.profile_id,
    removed_reason = p_reason where id = p_person_id;
  update individuals set status = 'available', position = null, updated_at = now() where id = p_person_id;

  perform fn_write_audit('REMOVE_PERSON', 'person', p_person_id, v_ptr.leader_id, v_ptr.id, p_person_id,
    jsonb_build_object('pointer_id', v_ptr.id), null, p_ip, p_user_agent);
end;
$$;

create or replace function fn_remove_pointer(p_pointer_id uuid, p_reason text default null,
  p_ip text default null, p_user_agent text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  ctx record;
  v_ptr pointers%rowtype;
  v_person_ids uuid[];
begin
  select * into ctx from fn_require_profile();
  select * into v_ptr from pointers where id = p_pointer_id and is_removed = false;
  if not found then raise exception 'No autorizado'; end if;
  if fn_individual_org(p_pointer_id) is distinct from ctx.organization_id then raise exception 'No autorizado'; end if;

  if ctx.role = 'leader' and v_ptr.leader_id <> ctx.leader_id then
    raise exception 'No autorizado';
  end if;
  if not fn_can_leader_write(ctx.organization_id) then
    raise exception 'CARGA_CERRADA';
  end if;

  select array_agg(id) into v_person_ids
    from registered_people where pointer_id = p_pointer_id and is_removed = false;

  update registered_people set is_removed = true, removed_at = now(), removed_by = ctx.profile_id,
    removed_reason = 'Puntero quitado' where pointer_id = p_pointer_id and is_removed = false;
  update individuals set status = 'available', position = null, updated_at = now()
    where id = any(coalesce(v_person_ids, array[]::uuid[]));

  update pointers set is_removed = true, removed_at = now(), removed_by = ctx.profile_id,
    removed_reason = p_reason where id = p_pointer_id;
  update individuals set status = 'available', position = null, updated_at = now() where id = p_pointer_id;

  perform fn_write_audit('REMOVE_POINTER', 'pointer', p_pointer_id, v_ptr.leader_id, p_pointer_id, null,
    jsonb_build_object('affected_people_count', coalesce(array_length(v_person_ids, 1), 0),
      'affected_people_ids', to_jsonb(coalesce(v_person_ids, array[]::uuid[]))),
    null, p_ip, p_user_agent);
end;
$$;

create or replace function fn_remove_leader(p_leader_id uuid, p_reason text default null,
  p_ip text default null, p_user_agent text default null)
returns void language plpgsql security definer set search_path = public as $$
declare ctx record;
begin
  select * into ctx from fn_require_profile();
  if ctx.role <> 'superadmin' then raise exception 'No autorizado'; end if;
  if fn_individual_org(p_leader_id) is distinct from ctx.organization_id then raise exception 'No autorizado'; end if;

  update leaders set is_removed = true, removed_at = now(), removed_by = ctx.profile_id, removed_reason = p_reason
    where id = p_leader_id;
  update individuals set status = 'available', position = null, updated_at = now() where id = p_leader_id;

  perform fn_write_audit('REMOVE_LEADER', 'leader', p_leader_id, p_leader_id, null, null, null, null, p_ip, p_user_agent);
end;
$$;

create or replace function fn_remove_vehicle(p_vehicle_id uuid, p_reason text default null,
  p_ip text default null, p_user_agent text default null)
returns void language plpgsql security definer set search_path = public as $$
declare ctx record; v vehicles%rowtype;
begin
  select * into ctx from fn_require_profile();
  select * into v from vehicles where id = p_vehicle_id and is_removed = false;
  if not found then raise exception 'No autorizado'; end if;
  if v.organization_id <> ctx.organization_id then raise exception 'No autorizado'; end if;
  if ctx.role = 'leader' and v.leader_id <> ctx.leader_id then raise exception 'No autorizado'; end if;
  if not fn_can_leader_write(ctx.organization_id) then raise exception 'CARGA_CERRADA'; end if;

  update vehicles set is_removed = true, removed_at = now(), removed_by = ctx.profile_id,
    removed_reason = p_reason where id = p_vehicle_id;

  perform fn_write_audit('REMOVE_VEHICLE', 'vehicle', p_vehicle_id, v.leader_id, null, null,
    jsonb_build_object('plate', v.plate_display), null, p_ip, p_user_agent);
end;
$$;

-- ============================================================================
-- 8. RESTAURACION (solo superadmin) — nunca sobrescribe una identidad activa
--
-- Nota sobre la prevencion de sobreescritura (punto 6): el chequeo de
-- conflicto ("¿esta `individuals.status` en 'available'?") y la actualizacion
-- que restaura se hacen sobre la MISMA fila bloqueada con `for update` dentro
-- de la misma transaccion implicita de la funcion. El `for update` obliga a
-- que cualquier otra transaccion que intente tocar esa misma fila (por
-- ejemplo, una alta/reasignacion concurrente vía fn_create_pointer/person)
-- espere a que esta termine; cuando esta commitea o aborta, la otra vuelve a
-- leer el estado ya actualizado. Esto cierra la ventana de carrera entre
-- "leer el estado" y "decidir si restaurar", que existiria si solo se hiciera
-- un SELECT simple antes del UPDATE.
-- ============================================================================

create or replace function fn_restore_person(p_person_id uuid, p_ip text default null, p_user_agent text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  ctx record;
  v_ind individuals%rowtype;
  v_rp registered_people%rowtype;
begin
  select * into ctx from fn_require_profile();
  if ctx.role <> 'superadmin' then raise exception 'No autorizado'; end if;
  if fn_individual_org(p_person_id) is distinct from ctx.organization_id then raise exception 'No autorizado'; end if;

  select * into v_rp from registered_people where id = p_person_id and is_removed = true;
  if not found then raise exception 'No esta en la papelera'; end if;

  select * into v_ind from individuals where id = p_person_id for update;
  if v_ind.status = 'active' then
    return jsonb_build_object('restored', false, 'conflict', true,
      'current_position', v_ind.position, 'individual_id', v_ind.id);
  end if;

  update registered_people set is_removed = false, removed_at = null, removed_by = null, removed_reason = null
    where id = p_person_id;
  update individuals set status = 'active', position = 'person', updated_at = now() where id = p_person_id;

  perform fn_write_audit('RESTORE_PERSON', 'person', p_person_id, null, v_rp.pointer_id, p_person_id,
    null, null, p_ip, p_user_agent);

  return jsonb_build_object('restored', true, 'conflict', false);
end;
$$;

create or replace function fn_restore_pointer(p_pointer_id uuid, p_ip text default null, p_user_agent text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  ctx record;
  v_ind individuals%rowtype;
  v_ptr pointers%rowtype;
  v_person record;
  v_person_ind individuals%rowtype;
  v_conflicts jsonb := '[]'::jsonb;
  v_restored_count int := 0;
begin
  select * into ctx from fn_require_profile();
  if ctx.role <> 'superadmin' then raise exception 'No autorizado'; end if;
  if fn_individual_org(p_pointer_id) is distinct from ctx.organization_id then raise exception 'No autorizado'; end if;

  select * into v_ptr from pointers where id = p_pointer_id and is_removed = true;
  if not found then raise exception 'No esta en la papelera'; end if;

  select * into v_ind from individuals where id = p_pointer_id for update;
  if v_ind.status = 'active' then
    return jsonb_build_object('restored', false, 'conflict', true, 'current_position', v_ind.position);
  end if;

  update pointers set is_removed = false, removed_at = null, removed_by = null, removed_reason = null
    where id = p_pointer_id;
  update individuals set status = 'active', position = 'pointer', updated_at = now() where id = p_pointer_id;

  for v_person in
    select rp.id from registered_people rp where rp.pointer_id = p_pointer_id and rp.is_removed = true
  loop
    select * into v_person_ind from individuals where id = v_person.id for update;
    if v_person_ind.status = 'active' then
      v_conflicts := v_conflicts || jsonb_build_object(
        'person_id', v_person.id, 'full_name', v_person_ind.full_name, 'current_position', v_person_ind.position
      );
    else
      update registered_people set is_removed = false, removed_at = null, removed_by = null, removed_reason = null
        where id = v_person.id;
      update individuals set status = 'active', position = 'person', updated_at = now() where id = v_person.id;
      v_restored_count := v_restored_count + 1;
    end if;
  end loop;

  perform fn_write_audit('RESTORE_POINTER', 'pointer', p_pointer_id, v_ptr.leader_id, p_pointer_id, null,
    null, jsonb_build_object('restored_people_count', v_restored_count, 'conflicts', v_conflicts),
    p_ip, p_user_agent);

  return jsonb_build_object('restored', true, 'conflict', false,
    'restored_people_count', v_restored_count, 'conflicts', v_conflicts);
end;
$$;

create or replace function fn_restore_leader(p_leader_id uuid, p_ip text default null, p_user_agent text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ctx record; v_ind individuals%rowtype;
begin
  select * into ctx from fn_require_profile();
  if ctx.role <> 'superadmin' then raise exception 'No autorizado'; end if;
  if fn_individual_org(p_leader_id) is distinct from ctx.organization_id then raise exception 'No autorizado'; end if;

  select * into v_ind from individuals where id = p_leader_id for update;
  if v_ind.status = 'active' then
    return jsonb_build_object('restored', false, 'conflict', true, 'current_position', v_ind.position);
  end if;

  update leaders set is_removed = false, removed_at = null, removed_by = null, removed_reason = null
    where id = p_leader_id;
  update individuals set status = 'active', position = 'leader', updated_at = now() where id = p_leader_id;

  perform fn_write_audit('RESTORE_LEADER', 'leader', p_leader_id, p_leader_id, null, null, null, null, p_ip, p_user_agent);
  return jsonb_build_object('restored', true, 'conflict', false);
end;
$$;

create or replace function fn_restore_vehicle(p_vehicle_id uuid, p_ip text default null, p_user_agent text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ctx record; v vehicles%rowtype;
begin
  select * into ctx from fn_require_profile();
  if ctx.role <> 'superadmin' then raise exception 'No autorizado'; end if;

  select * into v from vehicles where id = p_vehicle_id and is_removed = true for update;
  if not found then raise exception 'No esta en la papelera'; end if;
  if v.organization_id <> ctx.organization_id then raise exception 'No autorizado'; end if;

  if exists (
    select 1 from vehicles where organization_id = v.organization_id
      and plate_normalized = v.plate_normalized and is_removed = false
  ) then
    return jsonb_build_object('restored', false, 'conflict', true);
  end if;

  update vehicles set is_removed = false, removed_at = null, removed_by = null, removed_reason = null
    where id = p_vehicle_id;

  perform fn_write_audit('RESTORE_VEHICLE', 'vehicle', p_vehicle_id, v.leader_id, null, null,
    null, null, p_ip, p_user_agent);

  return jsonb_build_object('restored', true, 'conflict', false);
end;
$$;

-- ============================================================================
-- 9. CONTROL DE CARGA (superadmin)
-- ============================================================================

create or replace function fn_set_leader_access_status(p_leader_id uuid, p_status leader_access_status,
  p_ip text default null, p_user_agent text default null)
returns void language plpgsql security definer set search_path = public as $$
declare ctx record; v_before leader_access_status;
begin
  select * into ctx from fn_require_profile();
  if ctx.role <> 'superadmin' then raise exception 'No autorizado'; end if;
  if fn_individual_org(p_leader_id) is distinct from ctx.organization_id then raise exception 'No autorizado'; end if;

  select access_status into v_before from leaders where id = p_leader_id;
  update leaders set access_status = p_status where id = p_leader_id;
  perform fn_write_audit('SET_LEADER_ACCESS_STATUS', 'leader', p_leader_id, p_leader_id, null, null,
    jsonb_build_object('access_status', v_before), jsonb_build_object('access_status', p_status), p_ip, p_user_agent);
end;
$$;

create or replace function fn_set_global_loading(p_enabled boolean,
  p_ip text default null, p_user_agent text default null)
returns void language plpgsql security definer set search_path = public as $$
declare ctx record; v_before boolean;
begin
  select * into ctx from fn_require_profile();
  if ctx.role <> 'superadmin' then raise exception 'No autorizado'; end if;
  select loading_enabled into v_before from system_settings where organization_id = ctx.organization_id;
  update system_settings set loading_enabled = p_enabled, updated_by = ctx.profile_id, updated_at = now()
    where organization_id = ctx.organization_id;
  perform fn_write_audit(
    case when p_enabled then 'OPEN_GLOBAL_LOADING' else 'CLOSE_GLOBAL_LOADING' end,
    'system_settings', ctx.organization_id, null, null, null,
    jsonb_build_object('loading_enabled', v_before), jsonb_build_object('loading_enabled', p_enabled),
    p_ip, p_user_agent
  );
end;
$$;

