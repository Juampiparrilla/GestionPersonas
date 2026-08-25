// Script de una sola vez para crear el primer Administrador de Plataforma
// (multitenant, 0014). Igual motivo que bootstrap-superadmin.mjs: hace
// falta la service_role key porque todavia no existe nadie que lo pueda
// crear desde la app (fn_create_organization exige role='platform_admin',
// y no hay ningun platform_admin todavia -- problema del huevo y la
// gallina, se resuelve una sola vez a mano).
//
// A diferencia de un dirigente o un administrador de organizacion, el
// Administrador de Plataforma NO tiene organization_id (columna nullable
// desde 0014) ni fila en `individuals` -- inicia sesion por correo, nunca
// por DNI.
//
// Uso:
//   node --env-file=.env.local scripts/bootstrap-platform-admin.mjs \
//     --email admin@ejemplo.com \
//     --password "una-clave-segura" \
//     --name "Nombre Apellido"

import { createClient } from "@supabase/supabase-js";

function arg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  const value = idx !== -1 ? process.argv[idx + 1] : undefined;
  if (!value) {
    console.error(`Falta el argumento --${name}`);
    process.exit(1);
  }
  return value;
}

const email = arg("email");
const password = arg("password");
const fullName = arg("name");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local."
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (userError) {
    console.error("Error creando el usuario de login:", userError.message);
    process.exit(1);
  }
  console.log(`Usuario de login creado: ${userData.user.email}`);

  const { error: profileError } = await supabase.from("profiles").insert({
    id: userData.user.id,
    organization_id: null,
    full_name: fullName,
    role: "platform_admin",
  });

  if (profileError) {
    console.error("Error creando el perfil de Administrador de Plataforma:", profileError.message);
    process.exit(1);
  }

  console.log("\nListo. Ya podés iniciar sesión con ese correo y esa contraseña en /login.");
}

main();
