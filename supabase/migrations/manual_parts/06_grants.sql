-- ============================================================================
-- 11. GRANTS — minimos indispensables (punto 4)
--
-- Postgres otorga EXECUTE sobre funciones nuevas a PUBLIC por defecto (lo que
-- incluye, transitivamente, tanto a `anon` como a `authenticated`), y algunos
-- templates de Supabase conceden privilegios amplios sobre tablas a `anon`.
-- Se revoca todo explicitamente primero y se vuelve a otorgar solo lo minimo
-- indispensable a `authenticated`. `anon` no recibe NINGUN privilegio: esta
-- aplicacion no tiene ninguna pantalla ni dato accesible sin login.
-- ============================================================================

revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from anon;
revoke all on all sequences in schema public from anon;

revoke execute on all functions in schema public from public;

revoke insert, update, delete on
  organizations, profiles, individuals, leaders, pointers, registered_people,
  vehicles, audit_logs, system_settings, permissions, role_permissions, user_permissions
from authenticated;

grant usage on schema public to authenticated;

grant select on
  organizations, profiles, permissions, role_permissions, user_permissions,
  individuals, leaders, pointers, registered_people, vehicles, audit_logs, system_settings,
  report_email_schedules, scheduled_job_runs, backup_schedules
to authenticated;

-- fn_profile_context se ejecuta dentro de las policies RLS de arriba, que
-- corren con los privilegios de quien hace la consulta (authenticated):
-- por eso necesita EXECUTE explicito. El resto de las funciones de apoyo
-- (fn_require_profile, fn_can_leader_write, fn_write_audit, fn_normalize_dni,
-- fn_individual_org) solo se llaman desde dentro de otras funciones
-- SECURITY DEFINER y deliberadamente NO se otorgan: no hace falta, y asi
-- nadie puede invocarlas directo desde el cliente (por ejemplo, para forjar
-- una entrada de auditoria llamando a fn_write_audit a mano).
grant execute on function fn_profile_context() to authenticated;

grant execute on function
  fn_check_dni_availability(text),
  fn_admin_locate_dni(text),
  fn_admin_lookup_leader_profile(text),
  fn_create_leader(text, text, text, uuid, text, text),
  fn_create_pointer(uuid, text, text, text, text, text),
  fn_create_person(uuid, text, text, text, text, text),
  fn_update_leader(uuid, text, text, text, text),
  fn_update_pointer(uuid, text, text, text, text),
  fn_update_person(uuid, text, text, text, text),
  fn_create_vehicle(uuid, vehicle_type, text, text, text, text, text, text),
  fn_update_vehicle(uuid, vehicle_type, text, text, text, text, text, text),
  fn_remove_person(uuid, text, text, text),
  fn_remove_pointer(uuid, text, text, text),
  fn_remove_leader(uuid, text, text, text),
  fn_remove_vehicle(uuid, text, text, text),
  fn_restore_person(uuid, text, text),
  fn_restore_pointer(uuid, text, text),
  fn_restore_leader(uuid, text, text),
  fn_restore_vehicle(uuid, text, text),
  fn_set_leader_access_status(uuid, leader_access_status, text, text),
  fn_set_global_loading(boolean, text, text),
  fn_create_organization(text, text, text),
  fn_set_organization_active(uuid, boolean, text, text),
  fn_log_auth_event(text, text, text),
  fn_log_invitation_sent(uuid, uuid, text, text),
  fn_set_report_email_schedule(boolean, text, text, int, int, text[], text, text),
  fn_set_backup_schedule(boolean, text, int, int, int, text, text)
to authenticated;

-- Higiene a futuro: cualquier tabla/funcion que se cree en migraciones
-- posteriores tampoco queda expuesta por defecto a anon ni PUBLIC.
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke execute on functions from public;
