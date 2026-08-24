-- ============================================================================
-- 0008: corrige "infinite recursion detected in policy for relation
-- pointers" al usar el panel del dirigente
--
-- La policy individuals_select_own_structure (0007) hace, dentro de su
-- USING, un `exists (select 1 from pointers ...)` directo. Ese subselect
-- SI pasa por RLS de `pointers` (a diferencia de las funciones
-- security definer como fn_profile_context, que corren como el dueno de
-- la funcion y por eso no re-disparan RLS). Y pointers_select (0002), en su
-- rama superadmin/reports, hace a su vez `exists (select 1 from individuals
-- ...)`, que vuelve a evaluar TODAS las policies de individuals -- incluida
-- individuals_select_own_structure -- cerrando el ciclo:
--   individuals -> pointers -> individuals -> pointers -> ...
--
-- Antes de 0007 esto no pasaba porque la unica policy de individuals
-- (individuals_select_admin) no consultaba pointers/leaders para nada.
--
-- Fix: mover el chequeo de "es mi puntero / es una persona de mi puntero"
-- a una funcion security definer (mismo patron que fn_profile_context),
-- para que la subconsulta a pointers/registered_people corra sin pasar de
-- nuevo por RLS y el ciclo se corte de raiz.
-- ============================================================================

create or replace function fn_leader_owns_individual(p_individual_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from pointers p
    where p.id = p_individual_id
      and p.leader_id = (select leader_id from fn_profile_context())
  )
  or exists (
    select 1 from registered_people rp
    join pointers p on p.id = rp.pointer_id
    where rp.id = p_individual_id
      and p.leader_id = (select leader_id from fn_profile_context())
  );
$$;

revoke execute on function fn_leader_owns_individual(uuid) from anon;
grant execute on function fn_leader_owns_individual(uuid) to authenticated;

drop policy if exists individuals_select_own_structure on individuals;
create policy individuals_select_own_structure on individuals for select
  using (
    (select role from fn_profile_context()) = 'leader'
    and fn_leader_owns_individual(individuals.id)
  );
