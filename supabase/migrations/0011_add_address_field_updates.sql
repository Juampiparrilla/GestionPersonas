-- ============================================================================
-- 0011 (parte 2/2): funciones de EDICION con Direccion (ver 0010 para el
-- contexto completo -- se dividio en dos archivos por un corte de pegado
-- en el editor SQL de Supabase con el archivo original de un solo bloque)
-- ============================================================================

drop function if exists fn_update_leader(uuid, text, text, text, text);
create function fn_update_leader(p_leader_id uuid, p_full_name text, p_phone text,
  p_address text default null, p_ip text default null, p_user_agent text default null)
returns void language plpgsql security definer set search_path = public as $$
declare ctx record; v_before individuals%rowtype;
begin
  select * into ctx from fn_require_profile();
  if ctx.role <> 'superadmin' then raise exception 'No autorizado'; end if;
  if fn_individual_org(p_leader_id) is distinct from ctx.organization_id then raise exception 'No autorizado'; end if;

  select * into v_before from individuals where id = p_leader_id;
  update individuals set full_name = p_full_name, phone = p_phone, address = p_address, updated_at = now() where id = p_leader_id;
  perform fn_write_audit('UPDATE_LEADER', 'leader', p_leader_id, p_leader_id, null, null,
    jsonb_build_object('full_name', v_before.full_name, 'phone', v_before.phone, 'address', v_before.address),
    jsonb_build_object('full_name', p_full_name, 'phone', p_phone, 'address', p_address), p_ip, p_user_agent);
end;
$$;

drop function if exists fn_update_pointer(uuid, text, text, text, text);
create function fn_update_pointer(p_pointer_id uuid, p_full_name text, p_phone text,
  p_address text default null, p_ip text default null, p_user_agent text default null)
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
  update individuals set full_name = p_full_name, phone = p_phone, address = p_address, updated_at = now() where id = p_pointer_id;
  perform fn_write_audit('UPDATE_POINTER', 'pointer', p_pointer_id, v_ptr.leader_id, p_pointer_id, null,
    jsonb_build_object('full_name', v_before.full_name, 'phone', v_before.phone, 'address', v_before.address),
    jsonb_build_object('full_name', p_full_name, 'phone', p_phone, 'address', p_address), p_ip, p_user_agent);
end;
$$;

drop function if exists fn_update_person(uuid, text, text, text, text);
create function fn_update_person(p_person_id uuid, p_full_name text, p_phone text,
  p_address text default null, p_ip text default null, p_user_agent text default null)
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
  update individuals set full_name = p_full_name, phone = p_phone, address = p_address, updated_at = now() where id = p_person_id;
  perform fn_write_audit('UPDATE_PERSON', 'person', p_person_id, v_ptr.leader_id, v_ptr.id, p_person_id,
    jsonb_build_object('full_name', v_before.full_name, 'phone', v_before.phone, 'address', v_before.address),
    jsonb_build_object('full_name', p_full_name, 'phone', p_phone, 'address', p_address), p_ip, p_user_agent);
end;
$$;

revoke execute on function fn_update_leader(uuid, text, text, text, text, text) from anon;
revoke execute on function fn_update_pointer(uuid, text, text, text, text, text) from anon;
revoke execute on function fn_update_person(uuid, text, text, text, text, text) from anon;

grant execute on function fn_update_leader(uuid, text, text, text, text, text) to authenticated;
grant execute on function fn_update_pointer(uuid, text, text, text, text, text) to authenticated;
grant execute on function fn_update_person(uuid, text, text, text, text, text) to authenticated;
