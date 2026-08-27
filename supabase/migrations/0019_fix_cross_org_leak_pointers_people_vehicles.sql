-- ============================================================================
-- 0019: CRITICO -- corrige una fuga de datos entre organizaciones en
-- pointers/registered_people/vehicles.
--
-- Las policies de SELECT para superadmin/reports en estas 3 tablas
-- chequeaban SOLO el rol (`role in ('superadmin','reports')`), sin
-- comparar organizacion -- a diferencia de `leaders_select`, que si hace
-- el join correcto contra `individuals.organization_id`. Resultado real:
-- el Administrador de Organizacion (o un usuario 'reports') de CUALQUIER
-- organizacion podia leer los punteros, las personas registradas y los
-- vehiculos de TODAS las demas organizaciones, consultando directo la API
-- de Supabase -- bypaseando la UI por completo, que es exactamente el
-- vector que esta arquitectura (RLS como unica barrera real de datos)
-- siempre asumio que estaba cerrado.
--
-- No se detecto en las pruebas de aislamiento anteriores porque esas
-- pruebas siempre se hicieron con una sola organizacion de prueba activa
-- a la vez (se borraba antes de crear la siguiente) -- con una sola
-- organizacion con datos, un query sin filtro de organizacion devuelve
-- exactamente lo mismo que uno bien filtrado, y el hueco queda invisible
-- hasta que coexisten dos organizaciones con datos al mismo tiempo.
-- ============================================================================

drop policy if exists pointers_select on pointers;
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

drop policy if exists registered_people_select on registered_people;
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

drop policy if exists vehicles_select on vehicles;
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
