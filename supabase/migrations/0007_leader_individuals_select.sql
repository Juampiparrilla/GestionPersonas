-- ============================================================================
-- 0007: permite a un dirigente leer los datos (nombre/DNI/telefono) de SUS
-- PROPIOS punteros y personas registradas
--
-- individuals_select_admin (0001) solo dejaba leer esta tabla a
-- superadmin/reports. Estaba bien pensado para bloquear un SELECT libre,
-- pero se paso de estricto: un dirigente literalmente no tiene forma de ver
-- el nombre de sus propios punteros/personas sin esto, porque nombre/DNI
-- viven unicamente en individuals (pointers/registered_people no duplican
-- esos campos a proposito). Un JOIN no evita RLS: la policy de individuals
-- se evalua igual aunque se llegue via join desde pointers.
--
-- Esta policy es intencionalmente angosta: un dirigente solo ve individuals
-- que sean (a) uno de sus propios punteros, o (b) una persona registrada
-- bajo uno de sus propios punteros. Nunca ve individuals de otro dirigente
-- ni la disponibilidad general (para eso sigue existiendo
-- fn_check_dni_availability, que no revela de quien es un DNI ocupado).
-- ============================================================================

create policy individuals_select_own_structure on individuals for select
  using (
    (select role from fn_profile_context()) = 'leader'
    and (
      exists (
        select 1 from pointers p
        where p.id = individuals.id
          and p.leader_id = (select leader_id from fn_profile_context())
      )
      or exists (
        select 1 from registered_people rp
        join pointers p on p.id = rp.pointer_id
        where rp.id = individuals.id
          and p.leader_id = (select leader_id from fn_profile_context())
      )
    )
  );
