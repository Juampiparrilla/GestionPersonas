-- ============================================================================
-- 0012: un dirigente DADO DE BAJA (leaders.is_removed = true) deja de poder
-- LEER sus propios punteros/personas/vehiculos, no solo escribirlos.
--
-- Hallazgo de la auditoria de seguridad: fn_remove_leader() nunca desactiva
-- la cuenta de Supabase Auth del dirigente ni cascadea a sus punteros (a
-- diferencia de fn_remove_pointer, que si libera a sus personas). La
-- ESCRITURA ya quedaba bloqueada porque fn_can_leader_write() chequea
-- is_leader_removed, pero las policies de SELECT (pointers_select,
-- registered_people_select, vehicles_select) nunca miraban ese estado: un
-- dirigente removido que todavia recuerda su contraseña podia seguir
-- entrando y viendo (solo lectura) sus datos viejos como si nada.
--
-- Fix: agregar "and not is_leader_removed" a la rama de 'leader' de cada
-- policy de lectura. No se toca la rama de superadmin/reports (necesitan
-- poder seguir viendo todo, removido o no, para reportes/auditoria), ni el
-- caso access_status='read_only' (ese modo es intencionalmente de "solo
-- lectura", tiene que seguir leyendo -- read_only nunca setea is_removed).
--
-- fn_profile_context() ya devuelve is_leader_removed (coalesce a false si no
-- hay leader_id, ej. superadmin), asi que no hace falta un join nuevo.
-- ============================================================================

alter policy pointers_select on pointers using (
  (select role from fn_profile_context()) in ('superadmin', 'reports')
  or (
    leader_id = (select leader_id from fn_profile_context())
    and not (select is_leader_removed from fn_profile_context())
  )
);

alter policy registered_people_select on registered_people using (
  (select role from fn_profile_context()) in ('superadmin', 'reports')
  or (
    not (select is_leader_removed from fn_profile_context())
    and exists (
      select 1 from pointers p
      where p.id = registered_people.pointer_id and p.leader_id = (select leader_id from fn_profile_context())
    )
  )
);

alter policy vehicles_select on vehicles using (
  (select role from fn_profile_context()) in ('superadmin', 'reports')
  or (
    leader_id = (select leader_id from fn_profile_context())
    and not (select is_leader_removed from fn_profile_context())
  )
);
