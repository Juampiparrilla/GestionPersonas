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

create type user_role as enum ('superadmin', 'leader', 'reports');
create type individual_status as enum ('active', 'available');
create type individual_position as enum ('leader', 'pointer', 'person');
create type leader_access_status as enum ('active', 'read_only', 'inactive');
create type vehicle_type as enum ('auto', 'moto', 'traffic', 'colectivo');

-- ============================================================================
-- 2. TABLAS
-- ============================================================================

create table organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- leader_id se agrega como FK mas abajo (referencia circular con leaders)
create table profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  organization_id  uuid not null references organizations(id),
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

-- ============================================================================
-- 3. FUNCIONES DE APOYO (nunca se otorga EXECUTE de estas a `authenticated`,
--    salvo fn_profile_context que lo necesita para ser usada dentro de las
--    policies RLS; el resto solo se invoca desde dentro de otras funciones
--    SECURITY DEFINER, lo cual no requiere privilegio EXECUTE del llamador
--    original porque corren con los privilegios del dueño de la funcion).
-- ============================================================================

create or replace function fn_normalize_dni(p_dni text)
returns text language sql immutable set search_path = public as $$
  select regexp_replace(coalesce(p_dni, ''), '\D', '', 'g');
$$;

-- Contexto del usuario autenticado. No lanza excepcion si no hay sesion/perfil
-- (devuelve cero filas): la usan las policies RLS, donde un resultado vacio
-- simplemente hace que la condicion de la policy sea falsa (deniega), en vez
-- de romper la consulta con un error.
create or replace function fn_profile_context()
returns table (
  profile_id        uuid,
  organization_id   uuid,
  role              user_role,
  leader_id         uuid,
  access_status     leader_access_status,
  is_leader_removed boolean
) language sql stable security definer set search_path = public as $$
  select p.id, p.organization_id, p.role, p.leader_id,
         l.access_status, coalesce(l.is_removed, false)
  from profiles p
  left join leaders l on l.id = p.leader_id
  where p.id = auth.uid();
$$;

-- Igual que fn_profile_context(), pero para uso EXCLUSIVO dentro de las
-- funciones RPC de escritura/lectura privilegiada: si no hay `auth.uid()`
-- valido o no existe un `profiles` para ese usuario, corta con una excepcion
-- en vez de dejar que comparaciones contra columnas NULL (ctx.role <> 'x')
-- se evaluen como NULL y, en PL/pgSQL, un `IF NULL THEN` se trate como falso
-- y la funcion siga de largo sin autorizacion real. Este es el guard central
-- que responde al punto 3 ("validacion de auth.uid()") de forma sistematica.
create or replace function fn_require_profile()
returns table (
  profile_id        uuid,
  organization_id   uuid,
  role              user_role,
  leader_id         uuid,
  access_status     leader_access_status,
  is_leader_removed boolean
) language plpgsql stable security definer set search_path = public as $$
declare
  ctx record;
begin
  select * into ctx from fn_profile_context();
  if ctx.profile_id is null then
    raise exception 'No autenticado' using errcode = '28000';
  end if;
  return query select ctx.profile_id, ctx.organization_id, ctx.role, ctx.leader_id,
                      ctx.access_status, ctx.is_leader_removed;
end;
$$;

-- Organizacion real de una identidad (leader_id/pointer_id/person_id son,
-- todos, ids de `individuals`). Se usa para bloquear cruces entre organizaciones:
-- si el id no existe, devuelve NULL, y NULL IS DISTINCT FROM <org> siempre es
-- verdadero, asi que el llamador rechaza tanto "no existe" como "es de otra
-- organizacion" con el mismo mensaje generico (no se revela cual de las dos es).
create or replace function fn_individual_org(p_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select organization_id from individuals where id = p_id;
$$;

-- Regla de permiso efectivo de escritura para un dirigente:
--   carga_global_habilitada AND dirigente.access_status = 'active' AND no removido
-- El bloqueo individual nunca afloja el cierre global (solo puede sumar restriccion).
create or replace function fn_can_leader_write(p_organization_id uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  ctx record;
  v_loading boolean;
begin
  select * into ctx from fn_profile_context();
  if ctx.profile_id is null then
    return false;
  end if;
  if ctx.role = 'superadmin' then
    return true;
  end if;
  if ctx.role <> 'leader' then
    return false;
  end if;
  if ctx.is_leader_removed or ctx.access_status <> 'active' then
    return false;
  end if;
  select loading_enabled into v_loading from system_settings where organization_id = p_organization_id;
  return coalesce(v_loading, true);
end;
$$;

create or replace function fn_write_audit(
  p_action text, p_entity_type text, p_entity_id uuid,
  p_leader_id uuid, p_pointer_id uuid, p_person_id uuid,
  p_before jsonb, p_after jsonb,
  p_ip text, p_user_agent text
) returns void language plpgsql security definer set search_path = public as $$
declare
  ctx record;
begin
  select * into ctx from fn_profile_context();
  insert into audit_logs(
    organization_id, actor_profile_id, actor_role, action, entity_type, entity_id,
    leader_id, pointer_id, person_id, before_data, after_data, ip_address, user_agent
  ) values (
    ctx.organization_id, ctx.profile_id, ctx.role, p_action, p_entity_type, p_entity_id,
    p_leader_id, p_pointer_id, p_person_id, p_before, p_after, p_ip, p_user_agent
  );
end;
$$;

-- ============================================================================
-- 4. DUPLICADOS / IDENTIDAD
-- ============================================================================

-- Devuelve 'available' o 'blocked'. Nunca revela de quien es ni donde esta.
create or replace function fn_check_dni_availability(p_dni text)
returns text language plpgsql stable security definer set search_path = public as $$
declare
  ctx    record;
  v_ind  individuals%rowtype;
begin
  select * into ctx from fn_require_profile();
  select * into v_ind from individuals
    where organization_id = ctx.organization_id and dni_normalized = fn_normalize_dni(p_dni);
  if not found or v_ind.status = 'available' then
    return 'available';
  end if;
  return 'blocked';
end;
$$;

-- Solo superadmin: ubicacion real de un DNI, para resolver conflictos.
create or replace function fn_admin_locate_dni(p_dni text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  ctx     record;
  v_ind   individuals%rowtype;
  v_out   jsonb;
begin
  select * into ctx from fn_require_profile();
  if ctx.role <> 'superadmin' then
    raise exception 'No autorizado';
  end if;

  select * into v_ind from individuals
    where organization_id = ctx.organization_id and dni_normalized = fn_normalize_dni(p_dni);
  if not found then
    return jsonb_build_object('found', false);
  end if;

  v_out := jsonb_build_object(
    'found', true, 'individual_id', v_ind.id, 'full_name', v_ind.full_name,
    'status', v_ind.status, 'position', v_ind.position
  );

  if v_ind.position = 'pointer' then
    v_out := v_out || jsonb_build_object('leader_id', (select leader_id from pointers where id = v_ind.id));
  elsif v_ind.position = 'person' then
    v_out := v_out || jsonb_build_object('pointer_id', (select pointer_id from registered_people where id = v_ind.id));
  end if;

  return v_out;
end;
$$;

-- Solo superadmin: si el DNI corresponde a un dirigente (actual o en papelera)
-- que ya tuvo una cuenta de login, devuelve ese profile_id para que la UI
-- ofrezca "reactivar esta cuenta" en vez de crear una nueva (punto 2).
create or replace function fn_admin_lookup_leader_profile(p_dni text)
returns uuid language plpgsql stable security definer set search_path = public as $$
declare
  ctx   record;
  v_dni text;
  v_id  uuid;
begin
  select * into ctx from fn_require_profile();
  if ctx.role <> 'superadmin' then
    raise exception 'No autorizado';
  end if;
  v_dni := fn_normalize_dni(p_dni);
  select l.profile_id into v_id
    from individuals i
    join leaders l on l.id = i.id
    where i.organization_id = ctx.organization_id and i.dni_normalized = v_dni;
  return v_id;
end;
$$;

-- ============================================================================
-- 5. ALTAS (crean o reasignan reutilizando la misma fila de individuals)
-- ============================================================================

-- Reactivacion de cuenta (punto 2): si p_profile_id es NULL, se reutiliza la
-- cuenta previamente linkeada a este dirigente (si tenia una) — nunca se crea
-- una cuenta nueva de forma implicita desde esta funcion. Crear una cuenta
-- nueva es una decision explicita de la capa de aplicacion (Admin API de
-- Supabase Auth, fuera de esta base), que luego pasa su profile_id aca; en
-- ese caso la cuenta anterior queda desvinculada (nunca dos activas a la vez,
-- reforzado ademas por uq_leaders_profile_id).
create or replace function fn_create_leader(
  p_dni text, p_full_name text, p_phone text, p_profile_id uuid default null,
  p_ip text default null, p_user_agent text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  ctx              record;
  v_dni            text;
  v_ind            individuals%rowtype;
  v_old_profile    uuid;
  v_target_profile uuid;
  v_is_reassign    boolean := false;
begin
  select * into ctx from fn_require_profile();
  if ctx.role <> 'superadmin' then
    raise exception 'No autorizado';
  end if;

  if p_profile_id is not null
     and (select organization_id from profiles where id = p_profile_id) is distinct from ctx.organization_id then
    raise exception 'No autorizado';
  end if;

  v_dni := fn_normalize_dni(p_dni);
  select * into v_ind from individuals
    where organization_id = ctx.organization_id and dni_normalized = v_dni for update;

  if found and v_ind.status = 'active' then
    raise exception 'DNI_BLOCKED';
  end if;

  if found then
    v_is_reassign := true;
    update individuals set full_name = p_full_name, phone = p_phone,
      status = 'active', position = 'leader', updated_at = now()
      where id = v_ind.id;
    select profile_id into v_old_profile from leaders where id = v_ind.id;
  else
    insert into individuals(organization_id, dni_normalized, dni_display, full_name, phone, position, status)
      values (ctx.organization_id, v_dni, p_dni, p_full_name, p_phone, 'leader', 'active')
      returning * into v_ind;
    v_old_profile := null;
  end if;

  if p_profile_id is not null and exists (
    select 1 from leaders where profile_id = p_profile_id and id <> v_ind.id
  ) then
    raise exception 'PROFILE_ALREADY_LINKED';
  end if;

  v_target_profile := coalesce(p_profile_id, v_old_profile);

  insert into leaders(id, profile_id, created_by)
    values (v_ind.id, v_target_profile, ctx.profile_id)
  on conflict (id) do update set
    is_removed = false, removed_at = null, removed_by = null, removed_reason = null,
    access_status = 'active', profile_id = v_target_profile;

  -- Se reemplazo explicitamente la cuenta: desvincular la vieja para que nunca
  -- queden dos perfiles apuntando al mismo dirigente.
  if v_old_profile is not null and p_profile_id is not null and p_profile_id <> v_old_profile then
    update profiles set leader_id = null where id = v_old_profile;
  end if;

  if v_target_profile is not null then
    update profiles set leader_id = v_ind.id where id = v_target_profile;
  end if;

  perform fn_write_audit(
    case when v_is_reassign then 'REASSIGN_LEADER' else 'CREATE_LEADER' end,
    'leader', v_ind.id, v_ind.id, null, null,
    case when v_is_reassign then jsonb_build_object('previous_profile_id', v_old_profile) else null end,
    jsonb_build_object('full_name', p_full_name, 'dni', v_dni, 'profile_id', v_target_profile),
    p_ip, p_user_agent
  );

  return v_ind.id;
end;
$$;

create or replace function fn_create_pointer(
  p_leader_id uuid, p_dni text, p_full_name text, p_phone text,
  p_ip text default null, p_user_agent text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  ctx           record;
  v_dni         text;
  v_ind         individuals%rowtype;
  v_is_reassign boolean := false;
begin
  select * into ctx from fn_require_profile();

  if ctx.role not in ('leader', 'superadmin') then
    raise exception 'No autorizado';
  end if;
  if fn_individual_org(p_leader_id) is distinct from ctx.organization_id then
    raise exception 'No autorizado';
  end if;
  if ctx.role = 'leader' and ctx.leader_id <> p_leader_id then
    raise exception 'No autorizado';
  end if;
  if not fn_can_leader_write(ctx.organization_id) then
    raise exception 'CARGA_CERRADA';
  end if;

  v_dni := fn_normalize_dni(p_dni);
  select * into v_ind from individuals
    where organization_id = ctx.organization_id and dni_normalized = v_dni for update;

  if found and v_ind.status = 'active' then
    raise exception 'DNI_BLOCKED';
  end if;

  if found then
    v_is_reassign := true;
    update individuals set full_name = p_full_name, phone = p_phone,
      status = 'active', position = 'pointer', updated_at = now()
      where id = v_ind.id;
  else
    insert into individuals(organization_id, dni_normalized, dni_display, full_name, phone, position, status)
      values (ctx.organization_id, v_dni, p_dni, p_full_name, p_phone, 'pointer', 'active')
      returning * into v_ind;
  end if;

  insert into pointers(id, leader_id, created_by)
    values (v_ind.id, p_leader_id, ctx.profile_id)
  on conflict (id) do update set
    is_removed = false, removed_at = null, removed_by = null, removed_reason = null,
    leader_id = p_leader_id;

  perform fn_write_audit(
    case when v_is_reassign then 'REASSIGN_POINTER' else 'CREATE_POINTER' end,
    'pointer', v_ind.id, p_leader_id, v_ind.id, null,
    null, jsonb_build_object('full_name', p_full_name, 'dni', v_dni),
    p_ip, p_user_agent
  );

  return v_ind.id;
end;
$$;

create or replace function fn_create_person(
  p_pointer_id uuid, p_dni text, p_full_name text, p_phone text,
  p_ip text default null, p_user_agent text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  ctx           record;
  v_ptr         pointers%rowtype;
  v_dni         text;
  v_ind         individuals%rowtype;
  v_is_reassign boolean := false;
begin
  select * into ctx from fn_require_profile();

  select * into v_ptr from pointers where id = p_pointer_id and is_removed = false;
  if not found then
    raise exception 'No autorizado';
  end if;
  if fn_individual_org(p_pointer_id) is distinct from ctx.organization_id then
    raise exception 'No autorizado';
  end if;
  if ctx.role = 'leader' and v_ptr.leader_id <> ctx.leader_id then
    raise exception 'No autorizado';
  end if;
  if not fn_can_leader_write(ctx.organization_id) then
    raise exception 'CARGA_CERRADA';
  end if;

  v_dni := fn_normalize_dni(p_dni);
  select * into v_ind from individuals
    where organization_id = ctx.organization_id and dni_normalized = v_dni for update;

  if found and v_ind.status = 'active' then
    raise exception 'DNI_BLOCKED';
  end if;

  if found then
    v_is_reassign := true;
    update individuals set full_name = p_full_name, phone = p_phone,
      status = 'active', position = 'person', updated_at = now()
      where id = v_ind.id;
  else
    insert into individuals(organization_id, dni_normalized, dni_display, full_name, phone, position, status)
      values (ctx.organization_id, v_dni, p_dni, p_full_name, p_phone, 'person', 'active')
      returning * into v_ind;
  end if;

  insert into registered_people(id, pointer_id, created_by)
    values (v_ind.id, p_pointer_id, ctx.profile_id)
  on conflict (id) do update set
    is_removed = false, removed_at = null, removed_by = null, removed_reason = null,
    pointer_id = p_pointer_id;

  perform fn_write_audit(
    case when v_is_reassign then 'REASSIGN_PERSON' else 'CREATE_PERSON' end,
    'person', v_ind.id, v_ptr.leader_id, p_pointer_id, v_ind.id,
    null, jsonb_build_object('full_name', p_full_name, 'dni', v_dni),
    p_ip, p_user_agent
  );

  return v_ind.id;
end;
$$;

-- ============================================================================
-- 6. EDICION (nombre/telefono; el DNI no se edita: es la identidad)
-- ============================================================================

create or replace function fn_update_leader(p_leader_id uuid, p_full_name text, p_phone text,
  p_ip text default null, p_user_agent text default null)
returns void language plpgsql security definer set search_path = public as $$
declare ctx record; v_before individuals%rowtype;
begin
  select * into ctx from fn_require_profile();
  if ctx.role <> 'superadmin' then raise exception 'No autorizado'; end if;
  if fn_individual_org(p_leader_id) is distinct from ctx.organization_id then raise exception 'No autorizado'; end if;

  select * into v_before from individuals where id = p_leader_id;
  update individuals set full_name = p_full_name, phone = p_phone, updated_at = now() where id = p_leader_id;
  perform fn_write_audit('UPDATE_LEADER', 'leader', p_leader_id, p_leader_id, null, null,
    jsonb_build_object('full_name', v_before.full_name, 'phone', v_before.phone),
    jsonb_build_object('full_name', p_full_name, 'phone', p_phone), p_ip, p_user_agent);
end;
$$;

create or replace function fn_update_pointer(p_pointer_id uuid, p_full_name text, p_phone text,
  p_ip text default null, p_user_agent text default null)
returns void language plpgsql security definer set search_path = public as $$
declare ctx record; v_ptr pointers%rowtype; v_before individuals%rowtype;
begin
  select * into ctx from fn_require_profile();
  select * into v_ptr from pointers where id = p_pointer_id and is_removed = false;
  if not found then raise exception 'No autorizado'; end if;
  if fn_individual_org(p_pointer_id) is distinct from ctx.organization_id then raise exception 'No autorizado'; end if;
  if ctx.role = 'leader' and v_ptr.leader_id <> ctx.leader_id then raise exception 'No autorizado'; end if;
  if not fn_can_leader_write(ctx.organization_id) then raise exception 'CARGA_CERRADA'; end if;

  select * into v_before from individuals where id = p_pointer_id;
  update individuals set full_name = p_full_name, phone = p_phone, updated_at = now() where id = p_pointer_id;
  perform fn_write_audit('UPDATE_POINTER', 'pointer', p_pointer_id, v_ptr.leader_id, p_pointer_id, null,
    jsonb_build_object('full_name', v_before.full_name, 'phone', v_before.phone),
    jsonb_build_object('full_name', p_full_name, 'phone', p_phone), p_ip, p_user_agent);
end;
$$;

create or replace function fn_update_person(p_person_id uuid, p_full_name text, p_phone text,
  p_ip text default null, p_user_agent text default null)
returns void language plpgsql security definer set search_path = public as $$
declare ctx record; v_rp registered_people%rowtype; v_ptr pointers%rowtype; v_before individuals%rowtype;
begin
  select * into ctx from fn_require_profile();
  select * into v_rp from registered_people where id = p_person_id and is_removed = false;
  if not found then raise exception 'No autorizado'; end if;
  if fn_individual_org(p_person_id) is distinct from ctx.organization_id then raise exception 'No autorizado'; end if;
  select * into v_ptr from pointers where id = v_rp.pointer_id;
  if ctx.role = 'leader' and v_ptr.leader_id <> ctx.leader_id then raise exception 'No autorizado'; end if;
  if not fn_can_leader_write(ctx.organization_id) then raise exception 'CARGA_CERRADA'; end if;

  select * into v_before from individuals where id = p_person_id;
  update individuals set full_name = p_full_name, phone = p_phone, updated_at = now() where id = p_person_id;
  perform fn_write_audit('UPDATE_PERSON', 'person', p_person_id, v_ptr.leader_id, v_ptr.id, p_person_id,
    jsonb_build_object('full_name', v_before.full_name, 'phone', v_before.phone),
    jsonb_build_object('full_name', p_full_name, 'phone', p_phone), p_ip, p_user_agent);
end;
$$;

create or replace function fn_update_vehicle(p_vehicle_id uuid, p_type vehicle_type, p_plate text,
  p_driver_full_name text, p_driver_dni text, p_driver_phone text,
  p_ip text default null, p_user_agent text default null)
returns void language plpgsql security definer set search_path = public as $$
declare ctx record; v vehicles%rowtype; v_plate text;
begin
  select * into ctx from fn_require_profile();
  select * into v from vehicles where id = p_vehicle_id and is_removed = false;
  if not found then raise exception 'No autorizado'; end if;
  if v.organization_id <> ctx.organization_id then raise exception 'No autorizado'; end if;
  if ctx.role = 'leader' and v.leader_id <> ctx.leader_id then raise exception 'No autorizado'; end if;
  if not fn_can_leader_write(ctx.organization_id) then raise exception 'CARGA_CERRADA'; end if;

  v_plate := upper(regexp_replace(p_plate, '[^A-Za-z0-9]', '', 'g'));
  if v_plate <> v.plate_normalized and exists (
    select 1 from vehicles where organization_id = v.organization_id
      and plate_normalized = v_plate and is_removed = false
  ) then
    raise exception 'PLATE_BLOCKED';
  end if;

  update vehicles set type = p_type, plate_normalized = v_plate, plate_display = p_plate,
    driver_full_name = p_driver_full_name, driver_dni_normalized = fn_normalize_dni(p_driver_dni),
    driver_phone = p_driver_phone
    where id = p_vehicle_id;

  perform fn_write_audit('UPDATE_VEHICLE', 'vehicle', p_vehicle_id, v.leader_id, null, null,
    jsonb_build_object('plate', v.plate_display), jsonb_build_object('plate', p_plate), p_ip, p_user_agent);
end;
$$;

create or replace function fn_create_vehicle(
  p_leader_id uuid, p_type vehicle_type, p_plate text,
  p_driver_full_name text, p_driver_dni text, p_driver_phone text,
  p_ip text default null, p_user_agent text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  ctx     record;
  v_plate text;
  v_id    uuid;
begin
  select * into ctx from fn_require_profile();
  if fn_individual_org(p_leader_id) is distinct from ctx.organization_id then
    raise exception 'No autorizado';
  end if;
  if ctx.role = 'leader' and ctx.leader_id <> p_leader_id then
    raise exception 'No autorizado';
  end if;
  if not fn_can_leader_write(ctx.organization_id) then
    raise exception 'CARGA_CERRADA';
  end if;

  v_plate := upper(regexp_replace(p_plate, '[^A-Za-z0-9]', '', 'g'));
  if exists (
    select 1 from vehicles where organization_id = ctx.organization_id
      and plate_normalized = v_plate and is_removed = false
  ) then
    raise exception 'PLATE_BLOCKED';
  end if;

  insert into vehicles(
    organization_id, leader_id, type, plate_normalized, plate_display,
    driver_full_name, driver_dni_normalized, driver_phone, created_by
  ) values (
    ctx.organization_id, p_leader_id, p_type, v_plate, p_plate,
    p_driver_full_name, fn_normalize_dni(p_driver_dni), p_driver_phone, ctx.profile_id
  ) returning id into v_id;

  perform fn_write_audit('CREATE_VEHICLE', 'vehicle', v_id, p_leader_id, null, null,
    null, jsonb_build_object('plate', v_plate, 'driver', p_driver_full_name), p_ip, p_user_agent);

  return v_id;
end;
$$;

-- ============================================================================
-- 7. BAJAS LOGICAS (quitar) — nunca eliminan fisicamente
--
-- Nota sobre transaccionalidad (punto 5): cada una de estas funciones se
-- invoca como UNA sola sentencia SQL desde el cliente (`select fn_x(...)`).
-- Postgres ejecuta el cuerpo completo de la funcion dentro de esa misma
-- sentencia; si CUALQUIER paso interno lanza una excepcion (por ejemplo, una
-- violacion de FK o un `raise exception`), TODOS los efectos ya aplicados
-- dentro de la funcion se deshacen automaticamente junto con la sentencia
-- completa. No hay manejo manual de COMMIT/ROLLBACK ni bloques de excepcion
-- que absorban errores a mitad de camino, por lo que no existe un estado
-- intermedio posible: fn_remove_pointer, en particular, o libera a TODAS las
-- personas asociadas y marca el puntero como quitado, o no cambia nada.
-- ============================================================================

create or replace function fn_remove_person(p_person_id uuid, p_reason text default null,
  p_ip text default null, p_user_agent text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  ctx record;
  v_rp registered_people%rowtype;
  v_ptr pointers%rowtype;
begin
  select * into ctx from fn_require_profile();
  select * into v_rp from registered_people where id = p_person_id and is_removed = false;
  if not found then raise exception 'No autorizado'; end if;
  if fn_individual_org(p_person_id) is distinct from ctx.organization_id then raise exception 'No autorizado'; end if;
  select * into v_ptr from pointers where id = v_rp.pointer_id;

  if ctx.role = 'leader' and v_ptr.leader_id <> ctx.leader_id then
    raise exception 'No autorizado';
  end if;
  if not fn_can_leader_write(ctx.organization_id) then
    raise exception 'CARGA_CERRADA';
  end if;

  update registered_people set is_removed = true, removed_at = now(), removed_by = ctx.profile_id,
    removed_reason = p_reason where id = p_person_id;
  update individuals set status = 'available', position = null, updated_at = now() where id = p_person_id;

  perform fn_write_audit('REMOVE_PERSON', 'person', p_person_id, v_ptr.leader_id, v_ptr.id, p_person_id,
    jsonb_build_object('pointer_id', v_ptr.id), null, p_ip, p_user_agent);
end;
$$;

create or replace function fn_remove_pointer(p_pointer_id uuid, p_reason text default null,
  p_ip text default null, p_user_agent text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  ctx record;
  v_ptr pointers%rowtype;
  v_person_ids uuid[];
begin
  select * into ctx from fn_require_profile();
  select * into v_ptr from pointers where id = p_pointer_id and is_removed = false;
  if not found then raise exception 'No autorizado'; end if;
  if fn_individual_org(p_pointer_id) is distinct from ctx.organization_id then raise exception 'No autorizado'; end if;

  if ctx.role = 'leader' and v_ptr.leader_id <> ctx.leader_id then
    raise exception 'No autorizado';
  end if;
  if not fn_can_leader_write(ctx.organization_id) then
    raise exception 'CARGA_CERRADA';
  end if;

  select array_agg(id) into v_person_ids
    from registered_people where pointer_id = p_pointer_id and is_removed = false;

  update registered_people set is_removed = true, removed_at = now(), removed_by = ctx.profile_id,
    removed_reason = 'Puntero quitado' where pointer_id = p_pointer_id and is_removed = false;
  update individuals set status = 'available', position = null, updated_at = now()
    where id = any(coalesce(v_person_ids, array[]::uuid[]));

  update pointers set is_removed = true, removed_at = now(), removed_by = ctx.profile_id,
    removed_reason = p_reason where id = p_pointer_id;
  update individuals set status = 'available', position = null, updated_at = now() where id = p_pointer_id;

  perform fn_write_audit('REMOVE_POINTER', 'pointer', p_pointer_id, v_ptr.leader_id, p_pointer_id, null,
    jsonb_build_object('affected_people_count', coalesce(array_length(v_person_ids, 1), 0),
      'affected_people_ids', to_jsonb(coalesce(v_person_ids, array[]::uuid[]))),
    null, p_ip, p_user_agent);
end;
$$;

create or replace function fn_remove_leader(p_leader_id uuid, p_reason text default null,
  p_ip text default null, p_user_agent text default null)
returns void language plpgsql security definer set search_path = public as $$
declare ctx record;
begin
  select * into ctx from fn_require_profile();
  if ctx.role <> 'superadmin' then raise exception 'No autorizado'; end if;
  if fn_individual_org(p_leader_id) is distinct from ctx.organization_id then raise exception 'No autorizado'; end if;

  update leaders set is_removed = true, removed_at = now(), removed_by = ctx.profile_id, removed_reason = p_reason
    where id = p_leader_id;
  update individuals set status = 'available', position = null, updated_at = now() where id = p_leader_id;

  perform fn_write_audit('REMOVE_LEADER', 'leader', p_leader_id, p_leader_id, null, null, null, null, p_ip, p_user_agent);
end;
$$;

create or replace function fn_remove_vehicle(p_vehicle_id uuid, p_reason text default null,
  p_ip text default null, p_user_agent text default null)
returns void language plpgsql security definer set search_path = public as $$
declare ctx record; v vehicles%rowtype;
begin
  select * into ctx from fn_require_profile();
  select * into v from vehicles where id = p_vehicle_id and is_removed = false;
  if not found then raise exception 'No autorizado'; end if;
  if v.organization_id <> ctx.organization_id then raise exception 'No autorizado'; end if;
  if ctx.role = 'leader' and v.leader_id <> ctx.leader_id then raise exception 'No autorizado'; end if;
  if not fn_can_leader_write(ctx.organization_id) then raise exception 'CARGA_CERRADA'; end if;

  update vehicles set is_removed = true, removed_at = now(), removed_by = ctx.profile_id,
    removed_reason = p_reason where id = p_vehicle_id;

  perform fn_write_audit('REMOVE_VEHICLE', 'vehicle', p_vehicle_id, v.leader_id, null, null,
    jsonb_build_object('plate', v.plate_display), null, p_ip, p_user_agent);
end;
$$;

-- ============================================================================
-- 8. RESTAURACION (solo superadmin) — nunca sobrescribe una identidad activa
--
-- Nota sobre la prevencion de sobreescritura (punto 6): el chequeo de
-- conflicto ("¿esta `individuals.status` en 'available'?") y la actualizacion
-- que restaura se hacen sobre la MISMA fila bloqueada con `for update` dentro
-- de la misma transaccion implicita de la funcion. El `for update` obliga a
-- que cualquier otra transaccion que intente tocar esa misma fila (por
-- ejemplo, una alta/reasignacion concurrente vía fn_create_pointer/person)
-- espere a que esta termine; cuando esta commitea o aborta, la otra vuelve a
-- leer el estado ya actualizado. Esto cierra la ventana de carrera entre
-- "leer el estado" y "decidir si restaurar", que existiria si solo se hiciera
-- un SELECT simple antes del UPDATE.
-- ============================================================================

create or replace function fn_restore_person(p_person_id uuid, p_ip text default null, p_user_agent text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  ctx record;
  v_ind individuals%rowtype;
  v_rp registered_people%rowtype;
begin
  select * into ctx from fn_require_profile();
  if ctx.role <> 'superadmin' then raise exception 'No autorizado'; end if;
  if fn_individual_org(p_person_id) is distinct from ctx.organization_id then raise exception 'No autorizado'; end if;

  select * into v_rp from registered_people where id = p_person_id and is_removed = true;
  if not found then raise exception 'No esta en la papelera'; end if;

  select * into v_ind from individuals where id = p_person_id for update;
  if v_ind.status = 'active' then
    return jsonb_build_object('restored', false, 'conflict', true,
      'current_position', v_ind.position, 'individual_id', v_ind.id);
  end if;

  update registered_people set is_removed = false, removed_at = null, removed_by = null, removed_reason = null
    where id = p_person_id;
  update individuals set status = 'active', position = 'person', updated_at = now() where id = p_person_id;

  perform fn_write_audit('RESTORE_PERSON', 'person', p_person_id, null, v_rp.pointer_id, p_person_id,
    null, null, p_ip, p_user_agent);

  return jsonb_build_object('restored', true, 'conflict', false);
end;
$$;

create or replace function fn_restore_pointer(p_pointer_id uuid, p_ip text default null, p_user_agent text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  ctx record;
  v_ind individuals%rowtype;
  v_ptr pointers%rowtype;
  v_person record;
  v_person_ind individuals%rowtype;
  v_conflicts jsonb := '[]'::jsonb;
  v_restored_count int := 0;
begin
  select * into ctx from fn_require_profile();
  if ctx.role <> 'superadmin' then raise exception 'No autorizado'; end if;
  if fn_individual_org(p_pointer_id) is distinct from ctx.organization_id then raise exception 'No autorizado'; end if;

  select * into v_ptr from pointers where id = p_pointer_id and is_removed = true;
  if not found then raise exception 'No esta en la papelera'; end if;

  select * into v_ind from individuals where id = p_pointer_id for update;
  if v_ind.status = 'active' then
    return jsonb_build_object('restored', false, 'conflict', true, 'current_position', v_ind.position);
  end if;

  update pointers set is_removed = false, removed_at = null, removed_by = null, removed_reason = null
    where id = p_pointer_id;
  update individuals set status = 'active', position = 'pointer', updated_at = now() where id = p_pointer_id;

  for v_person in
    select rp.id from registered_people rp where rp.pointer_id = p_pointer_id and rp.is_removed = true
  loop
    select * into v_person_ind from individuals where id = v_person.id for update;
    if v_person_ind.status = 'active' then
      v_conflicts := v_conflicts || jsonb_build_object(
        'person_id', v_person.id, 'full_name', v_person_ind.full_name, 'current_position', v_person_ind.position
      );
    else
      update registered_people set is_removed = false, removed_at = null, removed_by = null, removed_reason = null
        where id = v_person.id;
      update individuals set status = 'active', position = 'person', updated_at = now() where id = v_person.id;
      v_restored_count := v_restored_count + 1;
    end if;
  end loop;

  perform fn_write_audit('RESTORE_POINTER', 'pointer', p_pointer_id, v_ptr.leader_id, p_pointer_id, null,
    null, jsonb_build_object('restored_people_count', v_restored_count, 'conflicts', v_conflicts),
    p_ip, p_user_agent);

  return jsonb_build_object('restored', true, 'conflict', false,
    'restored_people_count', v_restored_count, 'conflicts', v_conflicts);
end;
$$;

create or replace function fn_restore_leader(p_leader_id uuid, p_ip text default null, p_user_agent text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ctx record; v_ind individuals%rowtype;
begin
  select * into ctx from fn_require_profile();
  if ctx.role <> 'superadmin' then raise exception 'No autorizado'; end if;
  if fn_individual_org(p_leader_id) is distinct from ctx.organization_id then raise exception 'No autorizado'; end if;

  select * into v_ind from individuals where id = p_leader_id for update;
  if v_ind.status = 'active' then
    return jsonb_build_object('restored', false, 'conflict', true, 'current_position', v_ind.position);
  end if;

  update leaders set is_removed = false, removed_at = null, removed_by = null, removed_reason = null
    where id = p_leader_id;
  update individuals set status = 'active', position = 'leader', updated_at = now() where id = p_leader_id;

  perform fn_write_audit('RESTORE_LEADER', 'leader', p_leader_id, p_leader_id, null, null, null, null, p_ip, p_user_agent);
  return jsonb_build_object('restored', true, 'conflict', false);
end;
$$;

create or replace function fn_restore_vehicle(p_vehicle_id uuid, p_ip text default null, p_user_agent text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ctx record; v vehicles%rowtype;
begin
  select * into ctx from fn_require_profile();
  if ctx.role <> 'superadmin' then raise exception 'No autorizado'; end if;

  select * into v from vehicles where id = p_vehicle_id and is_removed = true for update;
  if not found then raise exception 'No esta en la papelera'; end if;
  if v.organization_id <> ctx.organization_id then raise exception 'No autorizado'; end if;

  if exists (
    select 1 from vehicles where organization_id = v.organization_id
      and plate_normalized = v.plate_normalized and is_removed = false
  ) then
    return jsonb_build_object('restored', false, 'conflict', true);
  end if;

  update vehicles set is_removed = false, removed_at = null, removed_by = null, removed_reason = null
    where id = p_vehicle_id;

  perform fn_write_audit('RESTORE_VEHICLE', 'vehicle', p_vehicle_id, v.leader_id, null, null,
    null, null, p_ip, p_user_agent);

  return jsonb_build_object('restored', true, 'conflict', false);
end;
$$;

-- ============================================================================
-- 9. CONTROL DE CARGA (superadmin)
-- ============================================================================

create or replace function fn_set_leader_access_status(p_leader_id uuid, p_status leader_access_status,
  p_ip text default null, p_user_agent text default null)
returns void language plpgsql security definer set search_path = public as $$
declare ctx record; v_before leader_access_status;
begin
  select * into ctx from fn_require_profile();
  if ctx.role <> 'superadmin' then raise exception 'No autorizado'; end if;
  if fn_individual_org(p_leader_id) is distinct from ctx.organization_id then raise exception 'No autorizado'; end if;

  select access_status into v_before from leaders where id = p_leader_id;
  update leaders set access_status = p_status where id = p_leader_id;
  perform fn_write_audit('SET_LEADER_ACCESS_STATUS', 'leader', p_leader_id, p_leader_id, null, null,
    jsonb_build_object('access_status', v_before), jsonb_build_object('access_status', p_status), p_ip, p_user_agent);
end;
$$;

create or replace function fn_set_global_loading(p_enabled boolean,
  p_ip text default null, p_user_agent text default null)
returns void language plpgsql security definer set search_path = public as $$
declare ctx record; v_before boolean;
begin
  select * into ctx from fn_require_profile();
  if ctx.role <> 'superadmin' then raise exception 'No autorizado'; end if;
  select loading_enabled into v_before from system_settings where organization_id = ctx.organization_id;
  update system_settings set loading_enabled = p_enabled, updated_by = ctx.profile_id, updated_at = now()
    where organization_id = ctx.organization_id;
  perform fn_write_audit(
    case when p_enabled then 'OPEN_GLOBAL_LOADING' else 'CLOSE_GLOBAL_LOADING' end,
    'system_settings', ctx.organization_id, null, null, null,
    jsonb_build_object('loading_enabled', v_before), jsonb_build_object('loading_enabled', p_enabled),
    p_ip, p_user_agent
  );
end;
$$;

-- ============================================================================
-- 10. ROW LEVEL SECURITY
-- ============================================================================

alter table organizations       enable row level security;
alter table profiles            enable row level security;
alter table permissions         enable row level security;
alter table role_permissions    enable row level security;
alter table user_permissions    enable row level security;
alter table individuals         enable row level security;
alter table leaders             enable row level security;
alter table pointers             enable row level security;
alter table registered_people   enable row level security;
alter table vehicles            enable row level security;
alter table audit_logs          enable row level security;
alter table system_settings     enable row level security;

-- Principio general: SOLO existen policies de SELECT para los roles de la app.
-- No hay ninguna policy de INSERT/UPDATE/DELETE para 'authenticated' en ninguna
-- tabla de negocio: toda escritura ocurre EXCLUSIVAMENTE dentro de las funciones
-- SECURITY DEFINER de arriba, que ya validan pertenencia, organizacion, rol,
-- estado de carga y registran auditoria de forma atomica. Esto vuelve la
-- prohibicion de escritura directa absoluta (no depende de acordarse de
-- agregar una policy en cada tabla nueva).

create policy org_select on organizations for select
  using (id = (select organization_id from fn_profile_context()));

create policy profiles_select on profiles for select
  using (
    id = auth.uid()
    or (
      (select role from fn_profile_context()) = 'superadmin'
      and organization_id = (select organization_id from fn_profile_context())
    )
  );

create policy permissions_select on permissions for select using (true);
create policy role_permissions_select on role_permissions for select using (true);
create policy user_permissions_select on user_permissions for select
  using (
    profile_id = auth.uid()
    or (select role from fn_profile_context()) = 'superadmin'
  );

create policy leaders_select on leaders for select
  using (
    exists (
      select 1 from individuals i
      where i.id = leaders.id and i.organization_id = (select organization_id from fn_profile_context())
    )
    and (
      (select role from fn_profile_context()) in ('superadmin', 'reports')
      or leaders.id = (select leader_id from fn_profile_context())
    )
  );

-- OJO: el chequeo de organizacion en la rama superadmin/reports es
-- imprescindible aca (pointers no tiene organization_id propio: pointers.id
-- ES individuals.id, por eso se resuelve la organizacion via esa tabla).
-- Sin ese chequeo, un superadmin de OTRA organizacion leeria estos punteros.
create policy pointers_select on pointers for select
  using (
    leader_id = (select leader_id from fn_profile_context())
    or (
      (select role from fn_profile_context()) in ('superadmin', 'reports')
      and exists (
        select 1 from individuals i
        where i.id = pointers.leader_id
          and i.organization_id = (select organization_id from fn_profile_context())
      )
    )
  );

create policy registered_people_select on registered_people for select
  using (
    exists (
      select 1 from pointers p
      where p.id = registered_people.pointer_id and p.leader_id = (select leader_id from fn_profile_context())
    )
    or (
      (select role from fn_profile_context()) in ('superadmin', 'reports')
      and exists (
        select 1 from pointers p
        join individuals i on i.id = p.leader_id
        where p.id = registered_people.pointer_id
          and i.organization_id = (select organization_id from fn_profile_context())
      )
    )
  );

-- individuals NUNCA se expone con select amplio a 'leader': solo superadmin/reports
-- pueden leerla directo. Los dirigentes ven nombre/telefono via join scoped desde
-- pointers/registered_people, y verifican disponibilidad de DNI solo por RPC.
create policy individuals_select_admin on individuals for select
  using (
    (select role from fn_profile_context()) in ('superadmin', 'reports')
    and organization_id = (select organization_id from fn_profile_context())
  );

create policy vehicles_select on vehicles for select
  using (
    leader_id = (select leader_id from fn_profile_context())
    or (
      (select role from fn_profile_context()) in ('superadmin', 'reports')
      and organization_id = (select organization_id from fn_profile_context())
    )
  );

create policy audit_select_admin on audit_logs for select
  using (
    (select role from fn_profile_context()) = 'superadmin'
    and organization_id = (select organization_id from fn_profile_context())
  );

create policy settings_select on system_settings for select
  using (organization_id = (select organization_id from fn_profile_context()));

-- ============================================================================
-- 11. GRANTS — minimos indispensables (punto 4)
--
-- Postgres otorga EXECUTE sobre funciones nuevas a PUBLIC por defecto (lo que
-- incluye, transitivamente, tanto a `anon` como a `authenticated`), y algunos
-- templates de Supabase conceden privilegios amplios sobre tablas a `anon`.
-- Se revoca todo explicitamente primero y se vuelve a otorgar solo lo minimo
-- indispensable a `authenticated`. `anon` no recibe NINGUN privilegio: esta
-- aplicacion no tiene ninguna pantalla ni dato accesible sin login.
-- ============================================================================

revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from anon;
revoke all on all sequences in schema public from anon;

revoke execute on all functions in schema public from public;

revoke insert, update, delete on
  organizations, profiles, individuals, leaders, pointers, registered_people,
  vehicles, audit_logs, system_settings, permissions, role_permissions, user_permissions
from authenticated;

grant usage on schema public to authenticated;

grant select on
  organizations, profiles, permissions, role_permissions, user_permissions,
  individuals, leaders, pointers, registered_people, vehicles, audit_logs, system_settings
to authenticated;

-- fn_profile_context se ejecuta dentro de las policies RLS de arriba, que
-- corren con los privilegios de quien hace la consulta (authenticated):
-- por eso necesita EXECUTE explicito. El resto de las funciones de apoyo
-- (fn_require_profile, fn_can_leader_write, fn_write_audit, fn_normalize_dni,
-- fn_individual_org) solo se llaman desde dentro de otras funciones
-- SECURITY DEFINER y deliberadamente NO se otorgan: no hace falta, y asi
-- nadie puede invocarlas directo desde el cliente (por ejemplo, para forjar
-- una entrada de auditoria llamando a fn_write_audit a mano).
grant execute on function fn_profile_context() to authenticated;

grant execute on function
  fn_check_dni_availability(text),
  fn_admin_locate_dni(text),
  fn_admin_lookup_leader_profile(text),
  fn_create_leader(text, text, text, uuid, text, text),
  fn_create_pointer(uuid, text, text, text, text, text),
  fn_create_person(uuid, text, text, text, text, text),
  fn_update_leader(uuid, text, text, text, text),
  fn_update_pointer(uuid, text, text, text, text),
  fn_update_person(uuid, text, text, text, text),
  fn_create_vehicle(uuid, vehicle_type, text, text, text, text, text, text),
  fn_update_vehicle(uuid, vehicle_type, text, text, text, text, text, text),
  fn_remove_person(uuid, text, text, text),
  fn_remove_pointer(uuid, text, text, text),
  fn_remove_leader(uuid, text, text, text),
  fn_remove_vehicle(uuid, text, text, text),
  fn_restore_person(uuid, text, text),
  fn_restore_pointer(uuid, text, text),
  fn_restore_leader(uuid, text, text),
  fn_restore_vehicle(uuid, text, text),
  fn_set_leader_access_status(uuid, leader_access_status, text, text),
  fn_set_global_loading(boolean, text, text)
to authenticated;

-- Higiene a futuro: cualquier tabla/funcion que se cree en migraciones
-- posteriores tampoco queda expuesta por defecto a anon ni PUBLIC.
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke execute on functions from public;
