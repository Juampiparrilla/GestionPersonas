# Gestión de Personas

Aplicación web (PWA) para la gestión administrativa de una estructura
Dirigentes → Punteros → Personas registradas, más Vehículos. No maneja
información electoral de ningún tipo (ver [ANALISIS.md](./ANALISIS.md)).

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- Supabase (Postgres, Auth, RLS)

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
