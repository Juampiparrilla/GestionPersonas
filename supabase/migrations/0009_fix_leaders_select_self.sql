-- ============================================================================
-- 0009: corrige que un dirigente nunca puede leer su PROPIA fila de `leaders`
--
-- leaders_select (0001) exige, con AND, que exista una fila en `individuals`
-- visible para el que consulta (org-scoped) Y (sea superadmin/reports O sea
-- su propio leader_id). El problema es el primer termino: ninguna policy de
-- `individuals` le da a un 'leader' visibilidad sobre su PROPIO registro
-- (individuals_select_admin es solo superadmin/reports; individuals_select_own_structure,
-- de 0007/0008, solo cubre punteros/personas que le pertenecen, no su propio
-- id de dirigente). Entonces el EXISTS siempre da falso para un 'leader', y
-- leaders_select nunca devuelve filas para ese rol -- ni siquiera la propia.
--
-- Esto nunca se habia notado porque hasta ahora ningun codigo consultaba
-- `leaders` directamente como dirigente autenticado (todo pasaba por
-- fn_profile_context, que es security definer y no pasa por RLS). Lo
-- expuso getLeaderWriteStatus (Fase 5), que si hace un select directo.
--
-- Fix: mismo patron ya usado en pointers_select/vehicles_select (0002) --
-- "es mi propio registro" como rama corta independiente con OR, sin pasar
-- por individuals para ese caso.
-- ============================================================================

drop policy if exists leaders_select on leaders;
create policy leaders_select on leaders for select
  using (
    leaders.id = (select leader_id from fn_profile_context())
    or (
      (select role from fn_profile_context()) in ('superadmin', 'reports')
      and exists (
        select 1 from individuals i
        where i.id = leaders.id
          and i.organization_id = (select organization_id from fn_profile_context())
      )
    )
  );
