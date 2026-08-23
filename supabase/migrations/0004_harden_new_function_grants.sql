-- ============================================================================
-- 0004: refuerza el bloqueo de EXECUTE para funciones nuevas
--
-- Se esperaba que `alter default privileges ... revoke execute on functions
-- from public` (0001) alcanzara para que fn_link_leader_profile (0003) no
-- quedara ejecutable por PUBLIC/anon por defecto. En la practica no fue asi
-- (probablemente por como Supabase corre cada sesion del SQL Editor), asi
-- que de aca en mas cada migracion que agregue una funcion nueva debe
-- revocar EXECUTE de PUBLIC de forma explicita, sin depender del default.
-- ============================================================================

revoke execute on function fn_link_leader_profile(uuid, uuid, text, text) from public;
