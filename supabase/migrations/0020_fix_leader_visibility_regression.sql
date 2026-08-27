-- ============================================================================
-- 0020: corrige una regresion introducida por 0019.
--
-- 0019 agrego un chequeo de organizacion a pointers_select/
-- registered_people_select via `exists (select 1 from individuals i
-- where ...)`. Ese subselect a `individuals` SI pasa por las policies
-- propias de esa tabla (no es security definer) -- y ninguna de esas
-- policies deja que un 'leader' lea su PROPIA fila en individuals
-- (individuals_select_admin exige superadmin/reports;
-- individuals_select_own_structure, de 0008, solo cubre punteros/personas
-- que le pertenecen, no a si mismo como dirigente). Resultado: el exists
-- de 0019 daba FALSE para cualquier puntero del propio dirigente, y
-- "Mis Punteros"/"Mis Personas" le aparecian vacios -- mientras que la
-- vista del Administrador de Organizacion (que si puede leer individuals)
-- seguia mostrando los conteos correctos. Por eso el numero no coincidia
-- entre las dos pantallas.
--
-- Fix: una funcion nueva, security definer (mismo patron que
-- fn_leader_owns_individual de 0008), que hace el chequeo de organizacion
-- SIN pasar por las policies de individuals -- corre como dueña de la
-- funcion, asi que no importa si el que pregunta puede o no leer esa fila
-- directamente. Se evita reusar fn_individual_org(uuid) tal cual (que
-- devuelve el organization_id crudo) porque esa funcion nunca se otorga a
-- `authenticated` a proposito (evita que cualquiera consulte de que
-- organizacion es un id cualquiera); esta nueva funcion solo devuelve un
-- boolean ("es de mi organizacion o no"), igual de estricta que
-- fn_leader_owns_individual.
--
-- De paso se corrige leaders_select con el mismo patron: tenia la misma
-- fragilidad (un dirigente viendo su propia fila en `leaders` tampoco
-- podia pasar el exists), no confirmada como sintoma visible todavia pero
-- con la misma causa de fondo.
-- ============================================================================

create or replace function fn_individual_org_matches_caller(p_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from individuals i
    where i.id = p_id
      and i.organization_id = (select organization_id from fn_profile_context())
  );
$$;

revoke execute on function fn_individual_org_matches_caller(uuid) from anon;
grant execute on function fn_individual_org_matches_caller(uuid) to authenticated;

drop policy if exists leaders_select on leaders;
create policy leaders_select on leaders for select
  using (
    fn_individual_org_matches_caller(leaders.id)
    and (
      (select role from fn_profile_context()) in ('superadmin', 'reports')
      or leaders.id = (select leader_id from fn_profile_context())
    )
  );

drop policy if exists pointers_select on pointers;
create policy pointers_select on pointers for select
  using (
    fn_individual_org_matches_caller(pointers.leader_id)
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
      where p.id = registered_people.pointer_id
        and fn_individual_org_matches_caller(p.leader_id)
        and (
          (select role from fn_profile_context()) in ('superadmin', 'reports')
          or (
            not (select is_leader_removed from fn_profile_context())
            and p.leader_id = (select leader_id from fn_profile_context())
          )
        )
    )
  );
