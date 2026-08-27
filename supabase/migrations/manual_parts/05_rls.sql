-- ============================================================================
-- 10. ROW LEVEL SECURITY
-- ============================================================================

alter table organizations       enable row level security;
alter table profiles            enable row level security;
alter table permissions         enable row level security;
alter table role_permissions    enable row level security;
alter table user_permissions    enable row level security;
alter table individuals         enable row level security;
alter table leaders             enable row level security;
alter table pointers             enable row level security;
alter table registered_people   enable row level security;
alter table vehicles            enable row level security;
alter table audit_logs          enable row level security;
alter table system_settings     enable row level security;
alter table report_email_schedules enable row level security;
alter table scheduled_job_runs  enable row level security;
alter table backup_schedules    enable row level security;

-- Principio general: SOLO existen policies de SELECT para los roles de la app.
-- No hay ninguna policy de INSERT/UPDATE/DELETE para 'authenticated' en ninguna
-- tabla de negocio: toda escritura ocurre EXCLUSIVAMENTE dentro de las funciones
-- SECURITY DEFINER de arriba, que ya validan pertenencia, organizacion, rol,
-- estado de carga y registran auditoria de forma atomica. Esto vuelve la
-- prohibicion de escritura directa absoluta (no depende de acordarse de
-- agregar una policy en cada tabla nueva).

-- platform_admin (0014) ve todas las organizaciones; el resto solo la suya.
create policy org_select on organizations for select
  using (
    id = (select organization_id from fn_profile_context())
    or (select role from fn_profile_context()) = 'platform_admin'
  );

create policy profiles_select on profiles for select
  using (
    id = auth.uid()
    or (select role from fn_profile_context()) = 'platform_admin'
    or (
      (select role from fn_profile_context()) = 'superadmin'
      and organization_id = (select organization_id from fn_profile_context())
    )
  );

create policy permissions_select on permissions for select using (true);
create policy role_permissions_select on role_permissions for select using (true);
create policy user_permissions_select on user_permissions for select
  using (
    profile_id = auth.uid()
    or (select role from fn_profile_context()) = 'superadmin'
  );

create policy leaders_select on leaders for select
  using (
    exists (
      select 1 from individuals i
      where i.id = leaders.id and i.organization_id = (select organization_id from fn_profile_context())
    )
    and (
      (select role from fn_profile_context()) in ('superadmin', 'reports')
      or leaders.id = (select leader_id from fn_profile_context())
    )
  );

-- Un dirigente DADO DE BAJA (is_leader_removed) pierde tambien la lectura,
-- no solo la escritura (ver migracion 0012) -- si no, alguien removido que
-- todavia recuerda su contraseña podria seguir viendo sus datos viejos.
-- read_only NO activa is_removed, asi que ese modo sigue leyendo normal.
--
-- 0019: el chequeo de organizacion (exists contra individuals) es
-- obligatorio incluso para la rama superadmin/reports -- pointers no tiene
-- columna organization_id propia, asi que sin este join un superadmin de
-- CUALQUIER organizacion veia los punteros de TODAS (bug real, corregido
-- en 0019 despues de pasar desapercibido en pruebas con una sola
-- organizacion activa a la vez).
create policy pointers_select on pointers for select
  using (
    exists (
      select 1 from individuals i
      where i.id = pointers.leader_id
        and i.organization_id = (select organization_id from fn_profile_context())
    )
    and (
      (select role from fn_profile_context()) in ('superadmin', 'reports')
      or (
        leader_id = (select leader_id from fn_profile_context())
        and not (select is_leader_removed from fn_profile_context())
      )
    )
  );

-- 0019: mismo bug y misma correccion que pointers_select -- el join contra
-- individuals (via pointers.leader_id) para validar organizacion es
-- obligatorio para TODAS las ramas, no solo la de dirigente.
create policy registered_people_select on registered_people for select
  using (
    exists (
      select 1
      from pointers p
      join individuals i on i.id = p.leader_id
      where p.id = registered_people.pointer_id
        and i.organization_id = (select organization_id from fn_profile_context())
        and (
          (select role from fn_profile_context()) in ('superadmin', 'reports')
          or (
            not (select is_leader_removed from fn_profile_context())
            and p.leader_id = (select leader_id from fn_profile_context())
          )
        )
    )
  );

-- individuals NUNCA se expone con select amplio a 'leader': solo superadmin/reports
-- pueden leerla directo. Los dirigentes ven nombre/telefono via join scoped desde
-- pointers/registered_people, y verifican disponibilidad de DNI solo por RPC.
create policy individuals_select_admin on individuals for select
  using (
    (select role from fn_profile_context()) in ('superadmin', 'reports')
    and organization_id = (select organization_id from fn_profile_context())
  );

-- 0019: vehicles SI tiene organization_id propia -- el chequeo directo
-- (sin join) es obligatorio igual, faltaba antes de 0019.
create policy vehicles_select on vehicles for select
  using (
    organization_id = (select organization_id from fn_profile_context())
    and (
      (select role from fn_profile_context()) in ('superadmin', 'reports')
      or (
        leader_id = (select leader_id from fn_profile_context())
        and not (select is_leader_removed from fn_profile_context())
      )
    )
  );

-- platform_admin (0014) ve auditoria de TODAS las organizaciones; superadmin
-- sigue acotado a la propia, como siempre.
create policy audit_select_admin on audit_logs for select
  using (
    (select role from fn_profile_context()) = 'platform_admin'
    or (
      (select role from fn_profile_context()) = 'superadmin'
      and organization_id = (select organization_id from fn_profile_context())
    )
  );

create policy settings_select on system_settings for select
  using (organization_id = (select organization_id from fn_profile_context()));

-- 0017: a diferencia de system_settings (que un dirigente tambien necesita
-- leer para saber si la carga esta habilitada), esto es exclusivamente de
-- gestion administrativa -- solo el Administrador de la propia organizacion.
create policy report_email_schedules_select on report_email_schedules for select
  using (
    (select role from fn_profile_context()) = 'superadmin'
    and organization_id = (select organization_id from fn_profile_context())
  );

create policy scheduled_job_runs_select on scheduled_job_runs for select
  using (
    (select role from fn_profile_context()) = 'superadmin'
    and organization_id = (select organization_id from fn_profile_context())
  );

create policy backup_schedules_select on backup_schedules for select
  using (
    (select role from fn_profile_context()) = 'superadmin'
    and organization_id = (select organization_id from fn_profile_context())
  );

