# Gestión de Personas

Aplicación web (PWA) para la gestión administrativa de una estructura
Dirigentes → Punteros → Personas registradas, más Vehículos. No maneja
información electoral de ningún tipo (ver [ANALISIS.md](./ANALISIS.md)).

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- Supabase (Postgres, Auth, RLS)

## Funcionalidades

### Roles

- **Superadmin**: control total de la organización.
- **Dirigente (leader)**: carga y gestiona sus propios punteros, las
  personas registradas de cada puntero, y sus vehículos. Inicia sesión con
  DNI, no con correo.
- **Reports**: rol de solo consulta (pantalla propia en construcción).

### Estructura de datos

```
Dirigente → Punteros → Personas registradas
Dirigente → Vehículos
```

Cada nivel tiene nombre completo, DNI y teléfono/dirección opcionales (los
vehículos en cambio tienen tipo, patente y datos del conductor). Alta,
edición y baja (soft-delete) para las cuatro entidades, con búsqueda por
nombre o DNI en las listas del dirigente.

### Permisos de carga

- **Interruptor global**: el Superadmin puede cerrar la carga de datos para
  toda la organización de un toque.
- **Estado individual por dirigente**: Activo / Solo lectura / Inactivo,
  independiente del interruptor global (un bloqueo individual nunca afloja
  el cierre global, solo puede sumar restricción).
- Cuando un dirigente no puede cargar, ve toda su información en modo
  lectura con el motivo explicado.

### Invitaciones

El Superadmin da de alta a un dirigente y genera una invitación (link por
WhatsApp, o mensaje para copiar si no hay teléfono cargado) para que el
propio dirigente defina su contraseña. El Superadmin puede reenviar la
invitación en cualquier momento mientras no haya sido aceptada.

### Búsqueda global

Disponible para Superadmin y Reports: un solo campo busca por DNI, nombre
o patente, con detección automática del tipo de búsqueda para no mezclar
resultados (ej. que los dígitos de una patente no matcheen un DNI).

### Reportes

- **Vistas del Superadmin** (`/superadmin/reportes`): Punteros, Personas
  registradas y Vehículos de toda la organización, agrupados por dirigente.
- **Vistas del dirigente**: las mismas, pero acotadas a su propia
  información (Mis Punteros, Personas registradas, Mis Vehículos).
- **Reporte personalizado** (`/superadmin/reportes/personalizado`): el
  Superadmin busca un dirigente o puntero puntual y elige qué generar —
  dirigente + sus punteros, dirigente + punteros + personas, un puntero +
  sus personas, o los vehículos de un dirigente.
- Todos los reportes se generan en **PDF y Excel**, numerados
  jerárquicamente (dirigente → puntero → persona).
- En las vistas globales del Superadmin, el PDF tiene dos modos: **sin
  saltos de línea** (todo en un flujo continuo, para uso interno) o **con
  saltos de línea** (cada dirigente arranca en una hoja nueva, para
  entregar por separado).
- Los nombres de archivo incluyen fecha y hora (zona horaria Argentina) y
  el tipo de reporte, ej. `Punteros_2026-08-25_01-56.pdf` o
  `Juampi_Prueba_Personas_2026-08-25_01-56.pdf`.

## Estructura del proyecto

```
app/            rutas (App Router), Server Components y Server Actions
components/     UI generica reutilizable
features/       componentes + acciones + queries por dominio (leaders, settings, ...)
lib/            clientes de Supabase, sesion, helpers de servidor
types/          tipos de dominio y de la base (a mano, ver types/database.ts)
utils/          formateo/validacion (DNI, telefono, nombre, WhatsApp)
supabase/
  migrations/   esquema SQL (tablas, RLS, funciones RPC), en orden
scripts/        scripts de una sola vez (bootstrap del primer Superadmin)
```

## Requisitos

- Node.js 20.9+
- Un proyecto de [Supabase](https://supabase.com/dashboard) (plan gratuito alcanza)

## 1. Instalación local

```bash
npm install
```

## 2. Variables de entorno

Copiá `.env.example` a `.env.local` y completá:

```
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key, Project Settings -> API>
SUPABASE_SERVICE_ROLE_KEY=<service_role key, Project Settings -> API>
```

La `anon key` es pública por diseño (la seguridad real la hacen las políticas
RLS). La `service_role key` es sensible: nunca se expone al navegador (no
lleva prefijo `NEXT_PUBLIC_`), solo la usan Server Actions puntuales que
necesitan crear cuentas de acceso para los dirigentes.

## 3. Aplicar el esquema de base de datos

En el SQL Editor del dashboard de Supabase, correr en orden los archivos de
`supabase/migrations/`:

1. `0001_init.sql`
2. `0002_fix_rls_tenant_isolation.sql`

Si `0001_init.sql` da un error de sintaxis raro al pegarlo, es casi siempre
un copy-paste incompleto (el archivo es largo): usar los archivos más chicos
en `supabase/migrations/manual_parts/` (01 a 06, en orden) en su lugar.

## 4. Crear la primera organización y el primer Superadmin

Este paso es de una sola vez: no existe todavía nadie que pueda crear un
usuario desde la aplicación, así que se hace con un script que usa la
`service_role key` directamente.

```bash
node --env-file=.env.local scripts/bootstrap-superadmin.mjs \
  --org "Nombre de la organización" \
  --email admin@ejemplo.com \
  --password "una-contraseña-segura" \
  --name "Nombre Apellido"
```

Después de esto, todo lo demás (crear dirigentes, otros usuarios, etc.) se
hace desde la aplicación, logueado como ese Superadmin.

## 5. Correr en local

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). Redirige solo a
`/login`.

## Login

Los dirigentes inician sesión con su **DNI** (no necesitan correo). El
Superadmin y los usuarios de reportes usan **correo electrónico**. El campo
de login acepta ambos formatos.

## Deploy en Vercel

1. Conectar el repositorio de GitHub en [vercel.com/new](https://vercel.com/new).
2. Vercel detecta Next.js automáticamente, no hace falta configuración extra.
3. En **Project Settings → Environment Variables**, cargar las mismas tres
   variables de `.env.local` (los tres entornos: Production, Preview,
   Development).
4. Deploy.

No hace falta dominio propio para arrancar: la URL de Vercel alcanza.

## Alcance

Esta aplicación se limita a gestión administrativa de estructura, personas y
vehículos. No implementa (ni va a implementar) nada relacionado a padrón
electoral, mesas, escuelas, intención de voto, ni scoring político — ver
[ANALISIS.md](./ANALISIS.md) para el detalle de diseño y las decisiones de
seguridad tomadas.
