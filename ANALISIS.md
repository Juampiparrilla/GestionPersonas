# Análisis de arquitectura — Gestión de Personas

Este documento resuelve el diseño antes de escribir código, como fue pedido. Cubre: arquitectura, esquema de base de datos, relaciones, RLS, estados, duplicados, auditoría, restauración, modo solo lectura y estructura de carpetas.

## 0. Contradicciones y ambigüedades detectadas (con resolución)

1. **DNI del conductor de un vehículo (punto 20 vs. regla de identidad).** El pedido dice que el DNI del conductor "debe validarse contra las reglas de identidad", pero un conductor no forma parte de la jerarquía dirigente→puntero→persona, y exigirle exclusividad total impediría que, por ejemplo, un puntero también maneje el vehículo del dirigente.
   **Resolución:** el DNI del conductor solo se normaliza y se valida como DNI válido. No compite por exclusividad con la tabla de identidad (`individuals`). Los vehículos son un eje independiente de la jerarquía.

2. **"Inactivo" del dirigente (punto 6) vs. "papelera"/restauración de dirigentes (puntos 17, 39, 43).** El spec describe tres estados operativos de acceso (Activo / Solo lectura / Inactivo) y, por separado, una papelera desde la que el Superadmin "restaura" dirigentes quitados. Son dos ejes distintos que se solapan si no se separan.
   **Resolución:** se modelan como dos columnas independientes en `leaders`: `access_status` (activo/solo_lectura/inactivo, uso diario del Superadmin) y `is_removed` (baja lógica que saca al dirigente del listado activo y lo manda a la papelera). Un dirigente removido implica acceso bloqueado automáticamente, pero no todo bloqueo implica remoción.

3. **Alcance de "auditoría de un dirigente" (punto 48).** Dice "eventualmente" podrían ver su propia actividad.
   **Resolución:** no se implementa en la v1 (deny por defecto vía RLS); se deja el modelo preparado (la tabla ya filtra por `organization_id`/`leader_id`, así que habilitarlo después es solo una policy nueva, no un cambio de esquema).

4. **Permisos granulares (punto 3, "preparar para permisos adicionales").** Roles son solo 3 hoy.
   **Resolución:** se agrega un catálogo `permissions` + `role_permissions` (defaults por rol) + `user_permissions` (overrides por usuario, vacío hoy). El código de autorización siempre resuelve "¿tiene el permiso X?" contra estas tablas, nunca contra `if role === 'leader'` hardcodeado, para que agregar granularidad después no toque la lógica de negocio.

Ninguna de estas resoluciones relaja seguridad ni integridad; ante duda se eligió la opción más simple para el usuario y más estricta para los datos, como pediste.

## 1. Arquitectura general

- **Next.js 14+ App Router, TypeScript estricto.** Server Components para lectura, **Server Actions** para toda escritura (nada de lógica de negocio en el cliente).
- **Supabase** como única fuente de datos: Postgres + Auth + RLS. El cliente del navegador solo lee lo que RLS ya permite; toda mutación con reglas complejas (crear puntero, quitar puntero con cascada, restaurar con detección de conflicto) se implementa como **función RPC de Postgres (`SECURITY DEFINER`, transaccional)**, invocada desde un Server Action. Así la regla de negocio vive en un solo lugar (la base) y no puede ser evitada llamando a la API directamente, ni duplicada entre frontend y backend.
- **Capa de servicios** (`services/`) en el proyecto Next.js: funciones TypeScript delgadas que llaman a esas RPC o a queries simples, tipadas con los tipos generados de Supabase. Los componentes nunca llaman a `supabase.from(...)` directo salvo en esa capa.
- **Middleware de Next.js** protege rutas por sesión + rol antes de que se rendericen (además de RLS, que es la barrera real de datos).

## 2. Esquema de base de datos

Tablas mínimas, sin sobre-ingeniería:

```
organizations
  id, name, is_active, created_at

profiles                         -- 1 fila por usuario de auth.users
  id (= auth.users.id, PK)
  organization_id
  full_name
  role            enum: superadmin | leader | reports
  leader_id       FK -> leaders.id, nullable (solo si role = leader)
  created_at

permissions                      -- catálogo, preparado a futuro
  id, code (ej. 'people.create'), description

role_permissions                 -- defaults por rol
  role, permission_id

user_permissions                 -- overrides puntuales (vacío en v1)
  profile_id, permission_id, granted (bool)

individuals                      -- IDENTIDAD ÚNICA por DNI (motor de la regla anti-duplicados)
  id
  organization_id
  dni_normalized   (solo dígitos)   UNIQUE (organization_id, dni_normalized)
  dni_display
  full_name
  phone
  position         enum: leader | pointer | person | null
  status           enum: active | available
  created_at, updated_at

leaders                          -- rol-específico, 1:1 con individuals cuando position=leader
  id (= individuals.id, PK/FK)
  profile_id       FK -> profiles.id, nullable (login asociado)
  access_status    enum: active | read_only | inactive
  is_removed, removed_at, removed_by, removed_reason
  created_by, created_at

pointers
  id (= individuals.id, PK/FK)
  leader_id        FK -> leaders.id
  is_removed, removed_at, removed_by, removed_reason
  created_by, created_at

registered_people
  id (= individuals.id, PK/FK)
  pointer_id       FK -> pointers.id
  is_removed, removed_at, removed_by, removed_reason
  created_by, created_at

vehicles
  id, organization_id
  leader_id        FK -> leaders.id
  type             enum: auto | moto | traffic | colectivo
  plate_normalized (sin espacios/guiones)   UNIQUE (organization_id, plate_normalized) WHERE is_removed = false
  plate_display
  driver_full_name, driver_dni_normalized, driver_phone
  is_removed, removed_at, removed_by, removed_reason
  created_by, created_at

audit_logs                       -- insert-only, inmutable
  id, organization_id
  actor_profile_id, actor_role
  action, entity_type, entity_id
  leader_id, pointer_id, person_id   -- nullable, para poder filtrar
  before_data jsonb, after_data jsonb
  ip_address, user_agent
  created_at

system_settings                  -- 1 fila por organización
  organization_id (PK)
  loading_enabled  bool default true
  updated_by, updated_at
```

**Por qué `individuals` es la pieza central:** en vez de comparar DNIs "a mano" en cada tabla, existe una única tabla de identidad con un `UNIQUE (organization_id, dni_normalized)`. Cuando alguien pasa de puntero a persona, o se da de baja y se reasigna, **es la misma fila** de `individuals` la que cambia de `position`/`status` — nunca se inserta una fila nueva para el mismo DNI. Esto hace que la regla "una persona, una posición activa" sea una restricción de base de datos, no solo una validación de aplicación (defensa en profundidad, punto 26).

Índices adicionales: `individuals(organization_id, status)`, `pointers(leader_id)`, `registered_people(pointer_id)`, `vehicles(leader_id)`, `audit_logs(organization_id, created_at desc)`, `audit_logs(leader_id)`.

## 3. Relaciones

```
organizations 1─N profiles
organizations 1─N individuals
leaders(1) ─N pointers(N) ─N registered_people
leaders(1) ─N vehicles
individuals(1) ─(0..1) leaders / pointers / registered_people   (según position)
profiles(0..1) ─ leaders   (un dirigente puede tener login propio)
```

`leaders`, `pointers` y `registered_people` **no** guardan nombre/DNI/teléfono propios: esos datos viven una sola vez en `individuals` y se leen por join. Evita inconsistencias (ej. nombre desactualizado en una tabla y no en otra).

## 4. Row Level Security

RLS habilitado en **todas** las tablas. Reglas por tabla (resumen; se implementan como policies `USING`/`WITH CHECK`):

- **profiles**: cada usuario ve su propia fila; `superadmin` ve/edita todas las de su `organization_id`.
- **leaders**: `superadmin`/`reports` → todas las de su organización. `leader` → únicamente la fila cuyo `id = profile.leader_id`. Insert/update/delete: solo `superadmin`.
- **pointers**: `superadmin`/`reports` → todas. `leader` → solo donde `leader_id = profile.leader_id`. Insert/update por el propio `leader` **solo si** `access_status='active' AND organization.loading_enabled=true` (chequeado también dentro de la función RPC, no solo en RLS).
- **registered_people**: igual patrón, mediante join a `pointers` para confirmar propiedad del dirigente.
- **vehicles**: igual patrón directo por `leader_id`.
- **individuals**: **no se expone con SELECT amplio**. Un `leader` normal no puede hacer `select * from individuals`. En su lugar:
  - Para pintar sus propias listas (sus punteros/personas), el frontend hace join scoped desde `pointers`/`registered_people`, nunca un select libre a `individuals`.
  - Para chequear si un DNI está disponible antes de registrar, se expone una función `SECURITY DEFINER` `check_dni_availability(dni text)` que devuelve **solo** `available | blocked` (nunca revela en qué estructura está, ni de quién). Así se cumple la regla anti-duplicados sin filtrar datos de otros dirigentes.
  - `superadmin`/`reports` sí pueden leer `individuals` completo dentro de su organización (para reportes y papelera).
- **audit_logs**: insert únicamente vía función `SECURITY DEFINER` (nunca insert directo de un rol autenticado). Select: solo `superadmin`. (Ver punto 0.3 para el futuro "ver mi propia actividad".)
- **system_settings**: select para cualquier usuario autenticado de la organización (necesitan saber si la carga está cerrada); update solo `superadmin`.
- Todas las policies filtran primero por `organization_id = profile.organization_id` — esto es lo que garantiza multi-tenancy real (punto 28): ni siquiera un bug de UI puede filtrar datos entre organizaciones, porque la base los bloquea.

**Gotcha operativo (encontrado al agregar `fn_link_leader_profile` en la migración 0003):** Supabase le otorga `EXECUTE` a `anon`/`authenticated`/`service_role` de forma automática y DIRECTA (no vía `PUBLIC`) a toda función nueva creada en `public`. Por eso `revoke execute on function ... from public` no alcanza para sacarle el permiso a `anon` — hay que revocarlo explícitamente `from anon` en la misma migración que crea la función. Toda migración futura que agregue una función nueva debe incluir esa revocación explícita (ver 0005_fix_anon_grant.sql).

## 5. Estados y su combinación

- `individuals.status`: `active` (ocupando una posición) | `available` (liberado, listo para reasignar).
- `leaders.access_status`: `active` | `read_only` | `inactive` — lo controla el Superadmin (punto 6).
- `system_settings.loading_enabled`: interruptor global (punto 5).
- `leaders.is_removed` / `pointers.is_removed` / `registered_people.is_removed` / `vehicles.is_removed`: baja lógica → papelera.

**Regla de permiso efectivo de escritura para un dirigente:**
```
puede_escribir = loading_enabled == true
             AND leader.access_status == 'active'
             AND leader.is_removed == false
```
El bloqueo individual **nunca afloja** el cierre global; solo puede endurecerlo (punto 6: "prevalece" = suma restricciones, no las quita). `access_status == 'inactive'` además bloquea el login (se valida en el Server Action de sesión, redirigiendo a una pantalla de "cuenta desactivada").

## 6. Cómo se evitan duplicados

1. Antes de insertar un dirigente/puntero/persona, se normaliza el DNI (quitar puntos, espacios, guiones → solo dígitos).
2. Se llama a `check_dni_availability(dni)`.
   - No existe en `individuals` → libre, se crea la fila de `individuals` (`status=active`) y la fila específica (`leaders`/`pointers`/`registered_people`) **en la misma transacción** (función RPC única).
   - Existe con `status='available'` → se **reutiliza** la misma fila de `individuals` (mismo `id`), se actualiza `position`/`status='active'`, y se crea/reactiva la fila específica. El histórico de `audit_logs` registra que es una persona reasignada, no nueva.
   - Existe con `status='active'` → bloqueado, mensaje genérico: *"Esta persona ya está registrada. No podés agregarla nuevamente porque ya forma parte de otra estructura."* Nunca se revela dónde.
3. Esto corre en el `SECURITY DEFINER` de Postgres, así que ni un llamado directo a la API de Supabase (saltando el frontend) puede evitarlo — la restricción `UNIQUE(organization_id, dni_normalized)` es la última línea de defensa si algo llegara a fallar en la lógica de la función.

## 7. Auditoría

- Toda mutación relevante (crear/editar/quitar/restaurar dirigente, puntero, persona, vehículo; cambios de `access_status`; toggle de `loading_enabled`) se registra desde **dentro de la misma función RPC** que hace el cambio (no desde el frontend, para que sea imposible mutar sin auditar).
- Se guarda estado anterior y nuevo (`before_data`/`after_data` en JSONB) con los campos relevantes, no solo "se borró algo" — cumple el punto 23 (poder reconstruir exactamente qué pasó).
- IP y user agent se capturan en el Server Action (Next.js tiene acceso a los headers de la request) y se pasan como parámetro a la función RPC.
- `audit_logs` es *insert-only*: no hay policy de `UPDATE`/`DELETE` para ningún rol (ni siquiera `superadmin`), así queda inmutable de verdad.

## 8. Restauración (papelera) y conflictos

- El Superadmin ve una lista de filas con `is_removed=true` (dirigentes, punteros, personas, vehículos).
- Al restaurar un puntero/persona/dirigente, la función RPC de restauración:
  1. Verifica `individuals.status` de esa persona.
  2. Si sigue `available` → restaura: `is_removed=false` en la fila específica, `individuals.status='active'`, `position` correspondiente, y registra la restauración en auditoría.
  3. Si ya está `active` (alguien la registró en otro lado mientras estaba disponible) → **no sobrescribe nada**; devuelve un conflicto con la ubicación nueva para que el Superadmin lo resuelva a mano (punto 39). Nunca hay una escritura automática que pise datos vigentes.
- Restaurar un puntero con personas asociadas también intenta restaurar esas personas (mismo chequeo de conflicto individual por cada una); las que tengan conflicto quedan listadas aparte, el resto se restaura.
- Restaurar un dirigente removido no restaura automáticamente sus punteros (eso se hace explícitamente desde la papelera de punteros), para no resucitar una estructura entera sin revisión.

## 9. Modo solo lectura (cierre de carga)

- Un Server Component obtiene, junto con la sesión, un `dashboard_context` (vía una función/query que junta `system_settings.loading_enabled` + `leaders.access_status`) y calcula `read_only_reason: 'cierre_global' | 'bloqueo_individual' | null`.
- Si `read_only_reason` está presente, el dashboard del dirigente renderiza la pantalla simple de "Reporte general / carga suspendida" (sin botones de agregar/editar/quitar) en vez del dashboard normal — es una decisión de UI basada en un solo valor, no un parche de deshabilitar botones sueltos.
- Aun en modo lectura, las Server Actions de escritura vuelven a chequear la misma condición server-side antes de tocar la base (defensa en profundidad — nunca confiar en que el botón esté oculto).

## 10. Estructura de carpetas propuesta

```
GestionPersonas/
  app/
    (auth)/
      login/
      recuperar-contrasena/
    (superadmin)/
      dashboard/
      dirigentes/
      usuarios/
      reportes/
      auditoria/
      papelera/
      configuracion/           -- carga global
    (leader)/
      dashboard/
      punteros/[id]/
      vehiculos/
    (reports)/
      dashboard/
    layout.tsx, middleware.ts
  components/                  -- UI genérica: Button, Card, ConfirmDialog, SearchInput, EmptyState
  features/
    leaders/    (components, actions.ts, queries.ts, schema.ts)
    pointers/
    people/
    vehicles/
    audit/
    reports/
    settings/
    auth/
  lib/
    supabase/  (client.ts, server.ts, middleware.ts)
    session.ts (perfil actual + rol + permisos + dashboard_context)
    permissions.ts (resolver "puede X" contra role_permissions/user_permissions)
  services/                    -- wrappers tipados sobre RPC/queries de Supabase
  types/                       -- tipos generados de Supabase + tipos de dominio
  hooks/
  utils/
    dni.ts, phone.ts, plate.ts, dates.ts
  supabase/
    migrations/
    seed.sql
  public/
    manifest.json, icons/, sw.js
  tests/
```

## 11. Próximo paso

Con esto validado, la Fase 1 (setup de Next.js + TypeScript + Tailwind + Supabase + estructura de carpetas) es el siguiente paso concreto, seguida de Fase 2 (migraciones SQL con este esquema + RLS). Aviso antes de tocar nada si aparece una decisión nueva que no esté cubierta acá.
