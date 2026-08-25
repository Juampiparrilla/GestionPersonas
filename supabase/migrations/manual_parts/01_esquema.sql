-- ============================================================================
-- GestionPersonas — esquema definitivo (v1)
-- Organizacion -> Dirigentes -> Punteros -> Personas registradas, + Vehiculos
--
-- GARANTIAS DE IDENTIDAD (documentado explicitamente, punto 1 de revision):
--   1) "Una identidad por DNI dentro de la organizacion" la garantiza la restriccion
--      estructural  UNIQUE (organization_id, dni_normalized)  en la tabla `individuals`.
--      Es imposible, a nivel de base, que existan dos filas para el mismo DNI.
--   2) "Una unica posicion ACTIVA a la vez" NO es una restriccion declarativa de
--      columna (position/status no tienen un unique ni un check que lo expresen
--      por si solos), sino una invariante que se sostiene porque:
--        a) leaders/pointers/registered_people tienen PK = individuals.id, es decir
--           un mismo individuo solo puede tener, a lo sumo, UNA fila viva (is_removed=false)
--           en cada una de esas tablas simultaneamente (por construccion, nunca se
--           insertan dos filas "activas" para el mismo id: se reutiliza siempre la
--           misma fila via `insert ... on conflict (id) do update`).
--        b) Toda alta/reasignacion pasa exclusivamente por las funciones
--           fn_create_leader / fn_create_pointer / fn_create_person, que hacen
--           `select ... for update` sobre `individuals` antes de decidir, dentro
--           de una unica transaccion implicita (la propia llamada a la funcion).
--           Eso serializa altas concurrentes sobre el mismo DNI: si esta `active`,
--           se bloquea (DNI_BLOCKED); si esta `available`, se reutiliza.
--      En otras palabras: el UNIQUE constraint impide identidades duplicadas;
--      las funciones RPC (con locking de fila) impiden que una misma identidad
--      tenga mas de una posicion activa a la vez. Son dos mecanismos distintos
--      y complementarios, no uno solo.
-- ============================================================================

create extension if not exists pgcrypto;

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

-- 'platform_admin' (0013/0014): administra organizaciones, no pertenece a
-- ninguna (profiles.organization_id es null para este rol). 'superadmin' se
-- muestra en la UI como "Administrador de Organizacion" (relabel de texto,
-- no de este identificador -- ver roleLabel() en el codigo de la app).
create type user_role as enum ('superadmin', 'leader', 'reports', 'platform_admin');
create type individual_status as enum ('active', 'available');
create type individual_position as enum ('leader', 'pointer', 'person');
create type leader_access_status as enum ('active', 'read_only', 'inactive');
create type vehicle_type as enum ('auto', 'moto', 'traffic', 'colectivo');

-- ============================================================================
-- 2. TABLAS
-- ============================================================================

-- created_by se agrega como FK mas abajo (referencia circular con profiles,
-- igual que leader_id/profiles con leaders)
create table organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  is_active   boolean not null default true,
  created_by  uuid,
  created_at  timestamptz not null default now()
);

-- leader_id se agrega como FK mas abajo (referencia circular con leaders)
-- organization_id es nullable desde 0014: solo platform_admin no pertenece
-- a ninguna organizacion. Todo profile con role != 'platform_admin' sigue
-- teniendo organization_id obligatorio en la practica (lo exige la Server
-- Action que crea la cuenta), pero no se puede expresar como NOT NULL de
-- columna porque la misma tabla sirve a los dos casos.
create table profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  organization_id  uuid references organizations(id),
  full_name        text not null,
  role             user_role not null,
  leader_id        uuid,
  created_at       timestamptz not null default now()
);

create table permissions (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,
  description  text not null
);

create table role_permissions (
  role           user_role not null,
  permission_id  uuid not null references permissions(id) on delete cascade,
  primary key (role, permission_id)
);

-- NOTA (alcance v1): estas tres tablas son el catalogo preparado para permisos
-- granulares futuros (punto 3 del pedido original). En v1 la autorizacion se
-- resuelve directamente por rol dentro de cada funcion RPC (mas simple y mas
-- facil de auditar linea por linea); estas tablas todavia NO se consultan en
-- tiempo de ejecucion. Cablearlas es un cambio aislado (agregar una funcion
-- fn_has_permission() y usarla en los checks de rol) que no requiere tocar el
-- esquema de nuevo.
create table user_permissions (
  profile_id     uuid not null references profiles(id) on delete cascade,
  permission_id  uuid not null references permissions(id) on delete cascade,
  granted        boolean not null,
  primary key (profile_id, permission_id)
);

-- Identidad unica por DNI dentro de la organizacion. Nunca se duplica una fila
-- para el mismo DNI: se reutiliza y se le cambia status/position (ver cabecera).
create table individuals (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id),
  dni_normalized   text not null,
  dni_display      text not null,
  full_name        text not null,
  phone            text,
  position         individual_position,          -- null cuando status = 'available'
  status           individual_status not null default 'active',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint uq_individuals_org_dni unique (organization_id, dni_normalized)
);

create table leaders (
  id              uuid primary key references individuals(id),
  profile_id      uuid references profiles(id),
  access_status   leader_access_status not null default 'active',
  is_removed      boolean not null default false,
  removed_at      timestamptz,
  removed_by      uuid references profiles(id),
  removed_reason  text,
  created_by      uuid not null references profiles(id),
  created_at      timestamptz not null default now()
);

-- Un profile (cuenta de login) nunca puede quedar linkeado a mas de un dirigente
-- a la vez. Es la base para la regla "no crear una segunda cuenta activa" (punto 2).
create unique index uq_leaders_profile_id on leaders (profile_id) where profile_id is not null;

alter table profiles
  add constraint fk_profiles_leader foreign key (leader_id) references leaders(id);

alter table organizations
  add constraint fk_organizations_created_by foreign key (created_by) references profiles(id);

create table pointers (
  id              uuid primary key references individuals(id),
  leader_id       uuid not null references leaders(id),
  is_removed      boolean not null default false,
  removed_at      timestamptz,
  removed_by      uuid references profiles(id),
  removed_reason  text,
  created_by      uuid not null references profiles(id),
  created_at      timestamptz not null default now()
);

create table registered_people (
  id              uuid primary key references individuals(id),
  pointer_id      uuid not null references pointers(id),
  is_removed      boolean not null default false,
  removed_at      timestamptz,
  removed_by      uuid references profiles(id),
  removed_reason  text,
  created_by      uuid not null references profiles(id),
  created_at      timestamptz not null default now()
);

create table vehicles (
  id                      uuid primary key default gen_random_uuid(),
  organization_id         uuid not null references organizations(id),
  leader_id               uuid not null references leaders(id),
  type                    vehicle_type not null,
  plate_normalized        text not null,
  plate_display           text not null,
  driver_full_name        text not null,
  driver_dni_normalized   text not null,
  driver_phone            text,
  is_removed              boolean not null default false,
  removed_at              timestamptz,
  removed_by              uuid references profiles(id),
  removed_reason          text,
  created_by              uuid not null references profiles(id),
  created_at              timestamptz not null default now()
);

-- La patente no debe repetirse entre vehiculos ACTIVOS (uno dado de baja libera la patente)
create unique index uq_vehicles_active_plate on vehicles (organization_id, plate_normalized)
  where is_removed = false;

-- Auditoria inmutable: solo insert, jamas update/delete (ni siquiera para superadmin)
create table audit_logs (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references organizations(id),
  actor_profile_id   uuid references profiles(id),
  actor_role         user_role,
  action             text not null,
  entity_type        text not null,
  entity_id          uuid,
  leader_id          uuid,
  pointer_id         uuid,
  person_id          uuid,
  before_data        jsonb,
  after_data         jsonb,
  ip_address         text,
  user_agent         text,
  created_at         timestamptz not null default now()
);

create table system_settings (
  organization_id  uuid primary key references organizations(id),
  loading_enabled  boolean not null default true,
  updated_by       uuid references profiles(id),
  updated_at       timestamptz not null default now()
);

-- Indices
create index ix_individuals_org_status on individuals (organization_id, status);
create index ix_pointers_leader on pointers (leader_id) where is_removed = false;
create index ix_pointers_leader_removed on pointers (leader_id) where is_removed = true;
create index ix_registered_people_pointer on registered_people (pointer_id) where is_removed = false;
create index ix_registered_people_pointer_removed on registered_people (pointer_id) where is_removed = true;
create index ix_vehicles_leader on vehicles (leader_id) where is_removed = false;
create index ix_audit_org_created on audit_logs (organization_id, created_at desc);
create index ix_audit_leader on audit_logs (leader_id);

