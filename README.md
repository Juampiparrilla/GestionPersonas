# Gestión de Personas

Aplicación web (PWA) multitenant para la gestión administrativa de
organizaciones con estructura Dirigentes → Punteros → Personas registradas,
más Vehículos. No maneja información electoral de ningún tipo (ver
[ANALISIS.md](./ANALISIS.md)).

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- Supabase (Postgres, Auth, RLS)
- Resend (reportes automáticos por email)
- GitHub Actions (backup real de la base de datos con `pg_dump`)

## Arquitectura multitenant

```
Administrador de Plataforma
  └── Organización (una por cliente)
        └── Administrador de Organización
              └── Dirigente
                    ├── Puntero → Personas registradas
                    └── Vehículo
```

El aislamiento entre organizaciones lo garantiza **RLS** (Row Level
Security) en Postgres, no la interfaz: cada política filtra por la
organización de quien está logueado, así que aunque alguien adivinara el
ID exacto de un dato de otra organización, la consulta igual devuelve
vacío. El Administrador de Plataforma es la única excepción diseñada a
propósito: administra organizaciones, pero **no tiene acceso a los datos
de negocio** (dirigentes, punteros, personas, vehículos) de ninguna de
ellas — eso es privado de cada una, por construcción.

## Funcionalidades

### Roles

- **Administrador de Plataforma**: crea y administra organizaciones, crea o
  reenvía el acceso del administrador de cada una, las activa o desactiva,
  y ve la auditoría de todas. No gestiona dirigentes, punteros, personas ni
  vehículos de ninguna organización.
- **Administrador de Organización** (`superadmin` en la base): control
  total dentro de su propia organización — dirigentes, carga asistida,
  auditoría, reportes, reportes por email y backups.
- **Dirigente** (`leader`): carga y gestiona sus propios punteros, las
  personas registradas de cada puntero, y sus vehículos.
- **Reports**: rol de solo consulta (pantalla propia en construcción, sin
  cuentas creadas todavía).

### Estructura de datos

```
Dirigente → Punteros → Personas registradas
Dirigente → Vehículos
```

Cada nivel tiene nombre completo, DNI y teléfono/dirección opcionales (los
vehículos en cambio tienen tipo, patente y datos del conductor). El campo
de nombre siempre sugiere el formato **"APELLIDO, NOMBRE"** para que los
listados y reportes queden ordenados de forma uniforme. Alta, edición y
baja (soft-delete) para las cuatro entidades, con búsqueda por nombre o DNI
en las listas del dirigente.

### Login

Cualquier persona puede iniciar sesión con su **DNI** — dirigentes,
administradores de organización y administrador de plataforma. El correo
electrónico es **opcional**: si no se carga uno real, se genera uno
sintético interno que la persona nunca ve ni necesita saber. El campo de
login acepta tanto DNI como correo, detectando el formato automáticamente.

### Permisos de carga

- **Organización activa/inactiva**: el Administrador de Plataforma puede
  desactivar una organización entera, bloqueando la carga para todos sus
  dirigentes y administradores de un toque.
- **Interruptor global por organización**: el Administrador de Organización
  puede cerrar la carga de datos para toda su organización.
- **Estado individual por dirigente**: Activo / Solo lectura / Inactivo,
  independiente de los interruptores anteriores (un bloqueo individual
  nunca afloja un cierre más arriba, solo puede sumar restricción).
- Cuando alguien no puede cargar, ve toda su información en modo lectura
  con el motivo explicado.

### Invitaciones

El Administrador de Plataforma da de alta una organización y genera la
invitación de su administrador; el Administrador de Organización hace lo
mismo con cada dirigente. En ambos casos se genera un link (por WhatsApp,
o mensaje para copiar si no hay teléfono cargado) para que la propia
persona defina su contraseña, reenviable en cualquier momento mientras no
haya sido aceptada.

### Carga asistida

Desde `/superadmin/carga-asistida`, el Administrador de Organización puede
agregar un puntero, una persona o un vehículo **en nombre de un dirigente
elegido** (por si el dirigente no puede cargarlo él mismo). Queda
registrado en la auditoría con el nombre de quien lo hizo realmente,
nunca suplantando la identidad del dirigente.

### Auditoría

Pantallas `/superadmin/auditoria` (acotada a la propia organización) y
`/plataforma/auditoria` (todas las organizaciones, con selector). Cada
fila se muestra en una frase legible en criollo (ej. "Administrador de
Organización X agregó al puntero Y para el dirigente Z"), con filtros por
dirigente, organización, tipo de acción y fecha. Incluye inicio/cierre de
sesión, invitaciones enviadas, y todas las altas/bajas/modificaciones ya
existentes.

### Búsqueda global

Disponible para el Administrador de Organización: un solo campo busca por
DNI, nombre o patente, con detección automática del tipo de búsqueda para
no mezclar resultados (ej. que los dígitos de una patente no matcheen un
DNI).

### Reportes

- **Vistas del Administrador de Organización** (`/superadmin/reportes`):
  Dirigentes, Punteros, Personas registradas y Vehículos de toda la
  organización, agrupados jerárquicamente.
- **Vistas del dirigente**: las mismas, pero acotadas a su propia
  información.
- **Reporte personalizado**: se busca un dirigente o puntero puntual y se
  elige qué generar.
- Todos los reportes se generan en **PDF y Excel** (Excel restringido al
  Administrador de Organización), numerados jerárquicamente y con el
  **nombre de la organización** en el encabezado.
- Los PDF globales tienen dos modos: sin saltos de página (uso interno) o
  con salto por dirigente (para entregar por separado).
- Los nombres de archivo incluyen fecha y hora (zona horaria Argentina).

### Reportes automáticos por email

Desde `/superadmin/respaldos`, el Administrador de Organización configura
el envío periódico (diario/semanal/mensual) de los reportes que elija a un
correo destinatario, con un botón "Enviar prueba" que manda ese mismo
email al toque. El envío automático corre una vez al día vía **Vercel
Cron** (`vercel.json` → `/api/cron/daily`), usando **Resend** como
proveedor de email.

### Backup real

En la misma pantalla, el Administrador de Organización puede sumar a su
organización al backup diario de toda la base de datos (un dump completo
vía `pg_dump`, corrido por **GitHub Actions** — no es lo mismo que
"exportar a Excel/PDF") y ver su propio historial de corridas
(éxito/error/fecha). El botón "Generar respaldo ahora" dispara el mismo
workflow a demanda. El archivo en sí queda en un bucket privado de
Supabase Storage, nunca se ofrece para descargar desde la app.

### Mi cuenta

Cualquier usuario logueado puede cambiar su propia contraseña desde
`/mi-cuenta` (ícono de engranaje en el panel), sin depender del correo.

### Ayuda por rol

El ícono "i" en cada panel abre un resumen en lenguaje simple de qué puede
hacer esa cuenta — pensado para alguien que recién empieza a usar la app.

## Estructura del proyecto

```
app/                   rutas (App Router), Server Components y Server Actions
  api/cron/daily/      cron diario de reportes por email
components/            UI generica reutilizable (LogoutButton, RoleHelpButton, ...)
features/              componentes + acciones + queries por dominio
  audit/                 auditoria (queries, frases legibles, pantalla)
  backups/                config y disparo del backup real
  carga-asistida/         carga en nombre de un dirigente
  organizations/          alta/gestion de organizaciones (Administrador de Plataforma)
  reportSchedules/        config de reportes automaticos por email
  ...leaders, pointers, people, vehicles, settings, search, reports
lib/
  email/                cliente de Resend + armado del email de reportes
  backups/              disparo del workflow de GitHub Actions
  reports/              generacion de PDF/Excel
  supabase/, session.ts, roles.ts, routes.ts, ...
types/                 tipos de dominio y de la base (a mano, ver types/database.ts)
utils/                 formateo/validacion (DNI, telefono, nombre, WhatsApp)
supabase/
  migrations/          esquema SQL (tablas, RLS, funciones RPC), en orden
  migrations/manual_parts/  el mismo esquema partido en archivos chicos (01-09)
scripts/
  backup/run.mjs       corrido por el workflow de GitHub Actions, nunca a mano
  bootstrap-platform-admin.mjs   primer Administrador de Plataforma (una sola vez)
.github/workflows/     workflow de backup real (pg_dump + GitHub Actions)
```

## Requisitos

- Node.js 20.9+
- Un proyecto de [Supabase](https://supabase.com/dashboard) (plan gratuito alcanza)
- Opcional: cuenta de [Resend](https://resend.com) (plan gratuito) para
  reportes por email
- Opcional: el repo en GitHub (ya lo está) para el backup real vía Actions

## 1. Instalación local

```bash
npm install
```

## 2. Variables de entorno

Copiá `.env.example` a `.env.local` y completá al menos las tres primeras
(Supabase). Las de Resend/cron/backup son opcionales: sin ellas, esas
funciones fallan con un mensaje de error claro, pero el resto de la app
funciona igual. El archivo `.env.example` tiene el detalle de cada una.

La `anon key` es pública por diseño (la seguridad real la hacen las
políticas RLS). La `service_role key` es sensible: nunca se expone al
navegador.

## 3. Aplicar el esquema de base de datos

En el SQL Editor del dashboard de Supabase, correr en orden los archivos
de `supabase/migrations/` (del `0001` al último número que exista). Si un
archivo da un error de sintaxis raro al pegarlo, es casi siempre un
copy-paste incompleto (algunos son largos): usar los archivos más chicos
de `supabase/migrations/manual_parts/` (01 a 09, en orden) en su lugar,
que son el mismo esquema partido para pegar de a poco.

## 4. Crear el primer Administrador de Plataforma

Este paso es de una sola vez: no existe todavía nadie que pueda crear un
usuario desde la aplicación, así que se hace con un script que usa la
`service_role key` directamente.

```bash
node --env-file=.env.local scripts/bootstrap-platform-admin.mjs \
  --email admin@ejemplo.com \
  --password "una-contraseña-segura" \
  --name "Nombre Apellido"
```

Después de esto, todo lo demás (crear organizaciones, administradores,
dirigentes, etc.) se hace desde la aplicación, logueado como ese
Administrador de Plataforma.

## 5. Correr en local

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). Redirige solo a
`/login`.

## Deploy en Vercel

1. Conectar el repositorio de GitHub en [vercel.com/new](https://vercel.com/new).
2. Vercel detecta Next.js automáticamente, no hace falta configuración extra.
3. En **Project Settings → Environment Variables**, cargar las variables
   de `.env.local` que uses (los tres entornos: Production, Preview,
   Development). Sin `RESEND_API_KEY` y `CRON_SECRET`, el envío de
   reportes por email no funciona en producción; el resto de la app sí.
4. Deploy.

No hace falta dominio propio para arrancar: la URL de Vercel alcanza. El
cron de reportes por email (`vercel.json`) corre una vez al día — es el
límite del plan Hobby de Vercel, no se puede elegir una hora exacta.

## Backup real — configuración adicional

El workflow [.github/workflows/backup.yml](.github/workflows/backup.yml)
corre solo (una vez al día) o a demanda desde el botón "Generar respaldo
ahora". Necesita estos **Secrets del repositorio de GitHub** (Settings →
Secrets and variables → Actions):

- `SUPABASE_URL`: la misma URL de `NEXT_PUBLIC_SUPABASE_URL`.
- `SUPABASE_SERVICE_ROLE_KEY`: la misma que usa la app.
- `SUPABASE_DB_URL`: connection string directo de Postgres (Supabase
  Dashboard → Project Settings → Database → Connection string → modo
  "URI", con la contraseña real incluida) — es lo único que `pg_dump`
  necesita y que la app no usa para nada más.

Y esta variable de entorno del **servidor de la app** (Vercel o
`.env.local`), para que el botón "Generar respaldo ahora" pueda disparar
el workflow:

- `GITHUB_ACTIONS_TOKEN`: un Personal Access Token de GitHub (fine-grained,
  scope "Actions: Read and write" sobre este repo únicamente).

Sin esto, el backup automático diario y el manual simplemente no van a
poder correr — el resto de la app no se ve afectado.

## Login

Cualquier rol inicia sesión con su **DNI** (el correo es opcional para
todos). El campo de login acepta ambos formatos.

## Alcance

Esta aplicación se limita a gestión administrativa de estructura, personas
y vehículos. No implementa (ni va a implementar) nada relacionado a
padrón electoral, mesas, escuelas, intención de voto, ni scoring político
— ver [ANALISIS.md](./ANALISIS.md) para el detalle de diseño y las
decisiones de seguridad tomadas.
