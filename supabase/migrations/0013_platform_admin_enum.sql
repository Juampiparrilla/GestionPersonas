-- ============================================================================
-- 0013: agrega el rol de plataforma (multitenant)
--
-- IMPORTANTE: esta migracion tiene que correr SOLA, en su propia ejecucion
-- del SQL Editor, separada de 0014. Postgres no permite usar un valor de
-- enum recien agregado dentro de la misma transaccion en la que se agrego
-- (ALTER TYPE ... ADD VALUE no es transaccional respecto a su propio uso
-- inmediato). El editor SQL de Supabase corre cada "Run" como su propia
-- transaccion, asi que: pegar y correr ESTE archivo solo primero, y recien
-- despues pegar 0014 en una ejecucion nueva.
-- ============================================================================

alter type user_role add value 'platform_admin';
