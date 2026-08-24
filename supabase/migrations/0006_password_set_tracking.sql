-- ============================================================================
-- 0006: rastrea si una cuenta ya termino de configurar su contraseña
--
-- Antes se usaba `last_sign_in_at` del usuario de auth para decidir si una
-- invitacion fue "aceptada", pero ese campo se marca apenas alguien ABRE el
-- link (incluso si despues no llega a poner una contraseña nueva y el link
-- expira). Se agrega una columna propia que se marca recien cuando la
-- persona efectivamente completa el paso de "elegir contraseña"
-- (app/(auth)/actualizar-contrasena), vía una funcion RPC (para que quede
-- auditado como cualquier otro cambio relevante).
-- ============================================================================

alter table profiles add column password_set_at timestamptz;

create or replace function fn_mark_password_set()
returns void language plpgsql security definer set search_path = public as $$
declare ctx record;
begin
  select * into ctx from fn_require_profile();
  update profiles set password_set_at = now() where id = ctx.profile_id;
  perform fn_write_audit('SET_PASSWORD', 'profile', ctx.profile_id, null, null, null,
    null, null, null, null);
end;
$$;

revoke execute on function fn_mark_password_set() from anon;
grant execute on function fn_mark_password_set() to authenticated;
