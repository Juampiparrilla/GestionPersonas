-- ============================================================================
-- 12. ORGANIZACIONES (Administrador de Plataforma) -- agregado en 0014
-- ============================================================================

-- Transaccional (todo el cuerpo es una sola sentencia SQL desde el cliente):
-- si algo falla, Postgres revierte todo. NO crea la cuenta de login del
-- administrador de la organizacion -- eso pasa por Supabase Auth
-- (admin.auth.admin.createUser), que no es una tabla que esta funcion pueda
-- insertar directo. Eso lo hace la Server Action de la app, reusando
-- lib/leader-access.ts::grantLeaderAccess generalizado.
create or replace function fn_create_organization(
  p_org_name text,
  p_ip text default null, p_user_agent text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  ctx    record;
  v_org  organizations%rowtype;
begin
  select * into ctx from fn_require_profile();
  if ctx.role <> 'platform_admin' then
    raise exception 'No autorizado';
  end if;

  insert into organizations(name, created_by) values (p_org_name, ctx.profile_id)
    returning * into v_org;

  insert into system_settings(organization_id) values (v_org.id);

  perform fn_write_audit(
    'ORGANIZATION_CREATED', 'organization', v_org.id,
    null, null, null,
    null, jsonb_build_object('name', p_org_name),
    p_ip, p_user_agent, v_org.id
  );

  return v_org.id;
end;
$$;

create or replace function fn_set_organization_active(
  p_organization_id uuid, p_is_active boolean,
  p_ip text default null, p_user_agent text default null
) returns void language plpgsql security definer set search_path = public as $$
declare
  ctx      record;
  v_before boolean;
begin
  select * into ctx from fn_require_profile();
  if ctx.role <> 'platform_admin' then
    raise exception 'No autorizado';
  end if;

  select is_active into v_before from organizations where id = p_organization_id;
  if not found then
    raise exception 'No encontrada';
  end if;

  update organizations set is_active = p_is_active where id = p_organization_id;

  perform fn_write_audit(
    case when p_is_active then 'ORGANIZATION_ACTIVATED' else 'ORGANIZATION_DEACTIVATED' end,
    'organization', p_organization_id, null, null, null,
    jsonb_build_object('is_active', v_before), jsonb_build_object('is_active', p_is_active),
    p_ip, p_user_agent, p_organization_id
  );
end;
$$;

revoke execute on function fn_create_organization(text, text, text) from anon;
revoke execute on function fn_set_organization_active(uuid, boolean, text, text) from anon;

grant execute on function fn_create_organization(text, text, text) to authenticated;
grant execute on function fn_set_organization_active(uuid, boolean, text, text) to authenticated;
