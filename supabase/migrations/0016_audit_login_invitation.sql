-- ============================================================================
-- 0016: dos puntos de auditoria que hoy no existen -- LOGIN/LOGOUT e
-- INVITATION_SENT (Fase 4 del plan multitenant, seccion 8).
--
-- Deliberadamente NO se otorga EXECUTE sobre fn_write_audit en general (ver
-- comentario en 06_grants.sql): eso dejaria que cualquier usuario logueado
-- fabrique una fila de auditoria con cualquier texto en `action`, incluido
-- uno que pise una accion real. En cambio, estas dos funciones son
-- "wrappers" angostos alrededor de fn_write_audit que solo aceptan una
-- accion fija (o un valor de una lista chica), y SI se otorgan a
-- authenticated -- mismo patron que cualquier otra fn_* de escritura.
-- ============================================================================

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
-- lib/leader-access.ts), desde la Server Action que ya sabe si el
-- destinatario es un dirigente (p_leader_id) o el administrador de una
-- organizacion (sin leader_id -- por eso el override, igual que
-- ORGANIZATION_CREATED: quien invita a un admin de organizacion puede ser
-- platform_admin, que no tiene organization_id propio).
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

grant execute on function
  fn_log_auth_event(text, text, text),
  fn_log_invitation_sent(uuid, uuid, text, text)
to authenticated;
