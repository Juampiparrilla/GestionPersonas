-- ============================================================================
-- 0014: multitenant real -- Administrador de Plataforma + organizaciones
--
-- Requiere que 0013 ya haya corrido (y haya terminado su propia
-- transaccion) antes de este archivo, porque acá se usa 'platform_admin'.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. profiles.organization_id nullable (solo platform_admin no tiene org)
-- ----------------------------------------------------------------------------

alter table profiles alter column organization_id drop not null;

-- ----------------------------------------------------------------------------
-- 2. organizations: trazabilidad de quien la creo + activar/desactivar
--    (is_active ya existia desde 0001, no hace falta agregarla)
-- ----------------------------------------------------------------------------

alter table organizations add column created_by uuid references profiles(id);

-- ----------------------------------------------------------------------------
-- 3. fn_write_audit: nuevo parametro opcional al final para poder loguear
--    contra una organizacion DISTINTA a la del que llama (el caso
--    platform_admin, que no tiene organization_id propia). Se dropea y
--    recrea (no "create or replace") porque agregar un parametro cambia la
--    identidad de la funcion para Postgres -- mismo patron ya usado en las
--    migraciones 0010/0011 para no crear un overload ambiguo.
--    No hace falta re-otorgar EXECUTE a authenticated: esta funcion nunca
--    se llamo directo desde el cliente, solo desde dentro de otras
--    funciones SECURITY DEFINER (mismo criterio que ya documenta 06_grants.sql).
-- ----------------------------------------------------------------------------

drop function if exists fn_write_audit(text, text, uuid, uuid, uuid, uuid, jsonb, jsonb, text, text);

create function fn_write_audit(
  p_action text, p_entity_type text, p_entity_id uuid,
  p_leader_id uuid, p_pointer_id uuid, p_person_id uuid,
  p_before jsonb, p_after jsonb,
  p_ip text, p_user_agent text,
  p_organization_id_override uuid default null
) returns void language plpgsql security definer set search_path = public as $$
declare
  ctx record;
begin
  select * into ctx from fn_profile_context();
  insert into audit_logs(
    organization_id, actor_profile_id, actor_role, action, entity_type, entity_id,
    leader_id, pointer_id, person_id, before_data, after_data, ip_address, user_agent
  ) values (
    coalesce(p_organization_id_override, ctx.organization_id), ctx.profile_id, ctx.role,
    p_action, p_entity_type, p_entity_id,
    p_leader_id, p_pointer_id, p_person_id, p_before, p_after, p_ip, p_user_agent
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- 4. fn_can_leader_write: una organizacion desactivada por el Administrador
--    de Plataforma bloquea toda escritura (leader Y superadmin), ademas del
--    interruptor de carga global que ya existia. Mismo nombre/firma que
--    antes (un solo parametro uuid, retorna boolean), asi que esto SI se
--    puede hacer con "create or replace" -- no cambia la identidad de la
--    funcion, solo el cuerpo.
-- ----------------------------------------------------------------------------

create or replace function fn_can_leader_write(p_organization_id uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  ctx record;
  v_loading boolean;
  v_org_active boolean;
begin
  select * into ctx from fn_profile_context();
  if ctx.profile_id is null then
    return false;
  end if;

  select is_active into v_org_active from organizations where id = p_organization_id;
  if not coalesce(v_org_active, false) then
    return false;
  end if;

  if ctx.role = 'superadmin' then
    return true;
  end if;
  if ctx.role <> 'leader' then
    return false;
  end if;
  if ctx.is_leader_removed or ctx.access_status <> 'active' then
    return false;
  end if;
  select loading_enabled into v_loading from system_settings where organization_id = p_organization_id;
  return coalesce(v_loading, true);
end;
$$;

-- ----------------------------------------------------------------------------
-- 5. fn_create_organization: crea la organizacion + su system_settings.
--    Transaccional (todo el cuerpo es una sola sentencia SQL desde el
--    cliente -- si algo falla, Postgres revierte todo). NO crea la cuenta
--    de login del administrador de la organizacion: eso pasa por
--    Supabase Auth (admin.auth.admin.createUser), que no es una tabla que
--    esta funcion pueda insertar directo -- lo hace la Server Action
--    despues, reusando lib/leader-access.ts::grantLeaderAccess
--    generalizado (ver codigo de la app).
-- ----------------------------------------------------------------------------

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

-- ----------------------------------------------------------------------------
-- 6. fn_set_organization_active: activar/desactivar (pedido explicito).
-- ----------------------------------------------------------------------------

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

-- ----------------------------------------------------------------------------
-- 7. RLS nueva para platform_admin -- SOLO se agregan ramas nuevas y
--    aisladas a policies de plataforma (organizations, profiles). Nunca se
--    toca pointers_select/registered_people_select/vehicles_select/
--    individuals_select_admin: un platform_admin sigue sin poder leer
--    datos de negocio de ninguna organizacion, por construccion (su
--    organization_id es null, y esas policies comparan
--    "columna = ctx.organization_id", que nunca es true contra null).
-- ----------------------------------------------------------------------------

drop policy if exists org_select on organizations;
create policy org_select on organizations for select
  using (
    id = (select organization_id from fn_profile_context())
    or (select role from fn_profile_context()) = 'platform_admin'
  );

drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select
  using (
    id = auth.uid()
    or (select role from fn_profile_context()) = 'platform_admin'
    or (
      (select role from fn_profile_context()) = 'superadmin'
      and organization_id = (select organization_id from fn_profile_context())
    )
  );

-- audit_logs: platform_admin ve auditoria de TODAS las organizaciones
-- (queda acotado a su propia org como ya estaba para superadmin).
drop policy if exists audit_select_admin on audit_logs;
create policy audit_select_admin on audit_logs for select
  using (
    (select role from fn_profile_context()) = 'platform_admin'
    or (
      (select role from fn_profile_context()) = 'superadmin'
      and organization_id = (select organization_id from fn_profile_context())
    )
  );

-- ----------------------------------------------------------------------------
-- 8. Grants -- mismo gotcha de siempre (0005): revocar de anon explicito y
--    otorgar a authenticated para toda funcion nueva.
-- ----------------------------------------------------------------------------

revoke execute on function fn_create_organization(text, text, text) from anon;
revoke execute on function fn_set_organization_active(uuid, boolean, text, text) from anon;

grant execute on function fn_create_organization(text, text, text) to authenticated;
grant execute on function fn_set_organization_active(uuid, boolean, text, text) to authenticated;
