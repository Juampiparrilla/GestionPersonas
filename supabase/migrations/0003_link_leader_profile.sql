-- ============================================================================
-- 0003: vincular una cuenta de acceso a un dirigente ya existente
--
-- Hace falta para poder invitar (o reinvitar) a un dirigente DESPUES de
-- creado, sin volver a pasar por fn_create_leader (que esta pensada para
-- alta/reasignacion de la identidad, no para solo enganchar un login). Se
-- hace como funcion RPC -- y no como un update directo desde la app -- para
-- que quede auditado igual que cualquier otra escritura.
-- ============================================================================

create or replace function fn_link_leader_profile(
  p_leader_id uuid, p_profile_id uuid,
  p_ip text default null, p_user_agent text default null
) returns void language plpgsql security definer set search_path = public as $$
declare
  ctx record;
  v_old_profile uuid;
begin
  select * into ctx from fn_require_profile();
  if ctx.role <> 'superadmin' then
    raise exception 'No autorizado';
  end if;
  if fn_individual_org(p_leader_id) is distinct from ctx.organization_id then
    raise exception 'No autorizado';
  end if;
  if (select organization_id from profiles where id = p_profile_id) is distinct from ctx.organization_id then
    raise exception 'No autorizado';
  end if;
  if exists (select 1 from leaders where profile_id = p_profile_id and id <> p_leader_id) then
    raise exception 'PROFILE_ALREADY_LINKED';
  end if;

  select profile_id into v_old_profile from leaders where id = p_leader_id;

  update leaders set profile_id = p_profile_id where id = p_leader_id;
  update profiles set leader_id = p_leader_id where id = p_profile_id;

  if v_old_profile is not null and v_old_profile <> p_profile_id then
    update profiles set leader_id = null where id = v_old_profile;
  end if;

  perform fn_write_audit('LINK_LEADER_PROFILE', 'leader', p_leader_id, p_leader_id, null, null,
    jsonb_build_object('previous_profile_id', v_old_profile),
    jsonb_build_object('profile_id', p_profile_id), p_ip, p_user_agent);
end;
$$;

grant execute on function fn_link_leader_profile(uuid, uuid, text, text) to authenticated;
