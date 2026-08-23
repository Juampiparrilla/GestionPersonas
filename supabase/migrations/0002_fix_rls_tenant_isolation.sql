-- ============================================================================
-- 0002: corrige aislamiento multi-organizacion en policies de SELECT
--
-- Las policies de pointers/registered_people/vehicles dejaban que CUALQUIER
-- superadmin o usuario de reportes, de CUALQUIER organizacion, leyera los
-- punteros/personas/vehiculos de TODAS las organizaciones (les faltaba el
-- chequeo de organization_id que si tenian leaders_select e
-- individuals_select_admin). Se corrige agregando el mismo chequeo.
--
-- Hoy solo existe una organizacion (Grupo Bordon), asi que esto no expuso
-- datos reales todavia -- se corrige antes de que exista una segunda.
-- ============================================================================

drop policy if exists pointers_select on pointers;
create policy pointers_select on pointers for select
  using (
    leader_id = (select leader_id from fn_profile_context())
    or (
      (select role from fn_profile_context()) in ('superadmin', 'reports')
      and exists (
        select 1 from individuals i
        where i.id = pointers.leader_id
          and i.organization_id = (select organization_id from fn_profile_context())
      )
    )
  );

drop policy if exists registered_people_select on registered_people;
create policy registered_people_select on registered_people for select
  using (
    exists (
      select 1 from pointers p
      where p.id = registered_people.pointer_id and p.leader_id = (select leader_id from fn_profile_context())
    )
    or (
      (select role from fn_profile_context()) in ('superadmin', 'reports')
      and exists (
        select 1 from pointers p
        join individuals i on i.id = p.leader_id
        where p.id = registered_people.pointer_id
          and i.organization_id = (select organization_id from fn_profile_context())
      )
    )
  );

drop policy if exists vehicles_select on vehicles;
create policy vehicles_select on vehicles for select
  using (
    leader_id = (select leader_id from fn_profile_context())
    or (
      (select role from fn_profile_context()) in ('superadmin', 'reports')
      and organization_id = (select organization_id from fn_profile_context())
    )
  );
