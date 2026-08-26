-- ============================================================================
-- 3. FUNCIONES DE APOYO (nunca se otorga EXECUTE de estas a `authenticated`,
--    salvo fn_profile_context que lo necesita para ser usada dentro de las
--    policies RLS; el resto solo se invoca desde dentro de otras funciones
--    SECURITY DEFINER, lo cual no requiere privilegio EXECUTE del llamador
--    original porque corren con los privilegios del dueño de la funcion).
-- ============================================================================

create or replace function fn_normalize_dni(p_dni text)
returns text language sql immutable set search_path = public as $$
  select regexp_replace(coalesce(p_dni, ''), '\D', '', 'g');
$$;

-- Contexto del usuario autenticado. No lanza excepcion si no hay sesion/perfil
-- (devuelve cero filas): la usan las policies RLS, donde un resultado vacio
-- simplemente hace que la condicion de la policy sea falsa (deniega), en vez
-- de romper la consulta con un error.
create or replace function fn_profile_context()
returns table (
  profile_id        uuid,
  organization_id   uuid,
  role              user_role,
  leader_id         uuid,
  access_status     leader_access_status,
  is_leader_removed boolean
) language sql stable security definer set search_path = public as $$
  select p.id, p.organization_id, p.role, p.leader_id,
         l.access_status, coalesce(l.is_removed, false)
  from profiles p
  left join leaders l on l.id = p.leader_id
  where p.id = auth.uid();
$$;

-- Igual que fn_profile_context(), pero para uso EXCLUSIVO dentro de las
-- funciones RPC de escritura/lectura privilegiada: si no hay `auth.uid()`
-- valido o no existe un `profiles` para ese usuario, corta con una excepcion
-- en vez de dejar que comparaciones contra columnas NULL (ctx.role <> 'x')
-- se evaluen como NULL y, en PL/pgSQL, un `IF NULL THEN` se trate como falso
-- y la funcion siga de largo sin autorizacion real. Este es el guard central
-- que responde al punto 3 ("validacion de auth.uid()") de forma sistematica.
create or replace function fn_require_profile()
returns table (
  profile_id        uuid,
  organization_id   uuid,
  role              user_role,
  leader_id         uuid,
  access_status     leader_access_status,
  is_leader_removed boolean
) language plpgsql stable security definer set search_path = public as $$
declare
  ctx record;
begin
  select * into ctx from fn_profile_context();
  if ctx.profile_id is null then
    raise exception 'No autenticado' using errcode = '28000';
  end if;
  return query select ctx.profile_id, ctx.organization_id, ctx.role, ctx.leader_id,
                      ctx.access_status, ctx.is_leader_removed;
end;
$$;

-- Organizacion real de una identidad (leader_id/pointer_id/person_id son,
-- todos, ids de `individuals`). Se usa para bloquear cruces entre organizaciones:
-- si el id no existe, devuelve NULL, y NULL IS DISTINCT FROM <org> siempre es
-- verdadero, asi que el llamador rechaza tanto "no existe" como "es de otra
-- organizacion" con el mismo mensaje generico (no se revela cual de las dos es).
create or replace function fn_individual_org(p_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select organization_id from individuals where id = p_id;
$$;

-- Regla de permiso efectivo de escritura para un dirigente:
--   organizacion.is_active AND carga_global_habilitada AND
--   dirigente.access_status = 'active' AND no removido
-- El bloqueo individual nunca afloja el cierre global (solo puede sumar
-- restriccion), y una organizacion desactivada por el Administrador de
-- Plataforma (0014) bloquea a TODOS los roles de esa organizacion, incluido
-- superadmin.
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

-- p_organization_id_override (0014): permite que un platform_admin (que no
-- tiene organization_id propia) audite una accion contra la organizacion
-- SOBRE LA QUE actua (ej. "creo la organizacion X") en vez de la suya
-- propia, que no existe. Default null preserva el comportamiento anterior
-- para todo el resto de las funciones, que jamas lo pasan.
create or replace function fn_write_audit(
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

-- 0016: dos puntos de auditoria angostos que solo aceptan una accion fija
-- (o una lista chica), a diferencia de fn_write_audit que NO se otorga a
-- authenticated (dejaria fabricar cualquier entrada). Ver 0016_audit_login_invitation.sql.
create or replace function fn_log_auth_event(
  p_action text,
  p_ip text default null,
  p_user_agent text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  ctx record;
begin
  select * into ctx from fn_require_profile();
  if p_action not in ('LOGIN', 'LOGOUT') then
    raise exception 'Accion invalida';
  end if;

  perform fn_write_audit(p_action, 'auth', null, null, null, null, null, null, p_ip, p_user_agent);
end;
$$;

-- Se llama despues de generar con exito el link de invitacion/reenvio (ver
-- lib/leader-access.ts). El destinatario puede ser un dirigente
-- (p_leader_id) o el administrador de una organizacion (sin leader_id --
-- el override cubre a platform_admin, que no tiene organization_id propio).
create or replace function fn_log_invitation_sent(
  p_leader_id uuid default null,
  p_organization_id_override uuid default null,
  p_ip text default null,
  p_user_agent text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  ctx record;
begin
  select * into ctx from fn_require_profile();
  if ctx.role not in ('superadmin', 'platform_admin') then
    raise exception 'No autorizado';
  end if;

  perform fn_write_audit(
    'INVITATION_SENT', 'profile', null,
    p_leader_id, null, null, null, null, p_ip, p_user_agent,
    p_organization_id_override
  );
end;
$$;

-- ============================================================================
-- 4. DUPLICADOS / IDENTIDAD
-- ============================================================================

-- Devuelve 'available' o 'blocked'. Nunca revela de quien es ni donde esta.
create or replace function fn_check_dni_availability(p_dni text)
returns text language plpgsql stable security definer set search_path = public as $$
declare
  ctx    record;
  v_ind  individuals%rowtype;
begin
  select * into ctx from fn_require_profile();
  select * into v_ind from individuals
    where organization_id = ctx.organization_id and dni_normalized = fn_normalize_dni(p_dni);
  if not found or v_ind.status = 'available' then
    return 'available';
  end if;
  return 'blocked';
end;
$$;

-- Solo superadmin: ubicacion real de un DNI, para resolver conflictos.
create or replace function fn_admin_locate_dni(p_dni text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  ctx     record;
  v_ind   individuals%rowtype;
  v_out   jsonb;
begin
  select * into ctx from fn_require_profile();
  if ctx.role <> 'superadmin' then
    raise exception 'No autorizado';
  end if;

  select * into v_ind from individuals
    where organization_id = ctx.organization_id and dni_normalized = fn_normalize_dni(p_dni);
  if not found then
    return jsonb_build_object('found', false);
  end if;

  v_out := jsonb_build_object(
    'found', true, 'individual_id', v_ind.id, 'full_name', v_ind.full_name,
    'status', v_ind.status, 'position', v_ind.position
  );

  if v_ind.position = 'pointer' then
    v_out := v_out || jsonb_build_object('leader_id', (select leader_id from pointers where id = v_ind.id));
  elsif v_ind.position = 'person' then
    v_out := v_out || jsonb_build_object('pointer_id', (select pointer_id from registered_people where id = v_ind.id));
  end if;

  return v_out;
end;
$$;

-- Solo superadmin: si el DNI corresponde a un dirigente (actual o en papelera)
-- que ya tuvo una cuenta de login, devuelve ese profile_id para que la UI
-- ofrezca "reactivar esta cuenta" en vez de crear una nueva (punto 2).
create or replace function fn_admin_lookup_leader_profile(p_dni text)
returns uuid language plpgsql stable security definer set search_path = public as $$
declare
  ctx   record;
  v_dni text;
  v_id  uuid;
begin
  select * into ctx from fn_require_profile();
  if ctx.role <> 'superadmin' then
    raise exception 'No autorizado';
  end if;
  v_dni := fn_normalize_dni(p_dni);
  select l.profile_id into v_id
    from individuals i
    join leaders l on l.id = i.id
    where i.organization_id = ctx.organization_id and i.dni_normalized = v_dni;
  return v_id;
end;
$$;

