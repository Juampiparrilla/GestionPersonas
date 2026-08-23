-- ============================================================================
-- 0005: corrige la revocacion de 0004
--
-- La causa real de que fn_link_leader_profile quedara ejecutable por `anon`:
-- Supabase le otorga EXECUTE a `anon` (y a `authenticated`/`service_role`)
-- de forma automatica a cada funcion nueva creada en `public`, como grant
-- DIRECTO a ese rol -- no via PUBLIC. Por eso `revoke ... from public`
-- (0004) no alcanzaba: `anon` no perdia nada porque su privilegio no venia
-- de PUBLIC. Regla para toda migracion futura que cree una funcion nueva:
-- siempre agregar `revoke execute on function <firma> from anon;`
-- explicitamente, ademas del `grant ... to authenticated` que corresponda.
-- ============================================================================

revoke execute on function fn_link_leader_profile(uuid, uuid, text, text) from anon;
