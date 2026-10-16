-- ============================================================================
-- 0021: limite de intentos de login fallidos
--
-- Cada intento fallido se registra con la IP y el identificador (correo o DNI
-- normalizado). La app (service_role, solo del lado del servidor) bloquea el
-- login cuando hay demasiados fallos recientes para esa IP o ese identificador.
-- RLS activado SIN politicas: ningun usuario autenticado ni anonimo puede
-- leer ni escribir esta tabla; solo la service_role, que saltea RLS.
-- ============================================================================

create table if not exists login_attempts (
  id          bigint generated always as identity primary key,
  ip          text,
  identifier  text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_login_attempts_identifier on login_attempts (identifier, created_at desc);
create index if not exists idx_login_attempts_ip on login_attempts (ip, created_at desc);

alter table login_attempts enable row level security;

revoke all on login_attempts from anon, authenticated;
