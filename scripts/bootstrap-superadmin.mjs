// Script de una sola vez para crear la primera organizacion, la configuracion
// de carga y el primer usuario Superadmin.
//
// Por que un script aparte y no la app: todas las funciones RPC de la base
// (fn_create_leader, etc.) requieren que quien llama ya tenga un `profiles`
// valido (fn_require_profile()). El primerísimo Superadmin no existe todavia,
// asi que no hay ninguna llamada "normal" que lo pueda crear: hace falta la
// service_role key, que bypassea RLS, y que por eso NUNCA se usa dentro de la
// app Next.js (solo en scripts locales como este, corridos a mano).
//
// Uso:
//   node --env-file=.env.local scripts/bootstrap-superadmin.mjs \
//     --org "Nombre de la organizacion" \
//     --email admin@ejemplo.com \
//     --password "una-clave-segura" \
//     --name "Nombre Apellido"
//
// Requiere en .env.local:
//   NEXT_PUBLIC_SUPABASE_URL       (ya deberia estar)
//   SUPABASE_SERVICE_ROLE_KEY      (Project Settings -> API -> service_role)

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

const orgName = arg("org");
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
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name: orgName })
    .select()
    .single();

  if (orgError) {
    console.error("Error creando la organizacion:", orgError.message);
    process.exit(1);
  }
  console.log(`Organizacion creada: ${org.name} (${org.id})`);

  const { error: settingsError } = await supabase
    .from("system_settings")
    .insert({ organization_id: org.id });

  if (settingsError) {
    console.error("Error creando la configuracion de carga:", settingsError.message);
    process.exit(1);
  }
  console.log("Carga global habilitada por defecto para esta organizacion.");

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
    organization_id: org.id,
    full_name: fullName,
    role: "superadmin",
  });

  if (profileError) {
    console.error("Error creando el perfil superadmin:", profileError.message);
    process.exit(1);
  }

  console.log("\nListo. Ya podes iniciar sesion con ese email y esa contrasena.");
}

main();
