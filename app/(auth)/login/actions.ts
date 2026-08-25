"use server";

import { redirect } from "next/navigation";

import { roleHomePath } from "@/lib/routes";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizeDni } from "@/utils/dni";

export type LoginState = { error: string | null };

// El campo de login acepta correo O DNI. Si es DNI, se resuelve al correo
// real de la cuenta ANTES de intentar la contraseña -- esta resolucion usa
// el cliente con service_role porque todavia no hay sesion (no se puede usar
// el cliente normal, RLS bloquearia la lectura). La contraseña en si sigue
// verificandose con el flujo normal de Supabase Auth, nunca se saltea.
//
// Nota multitenant (0014): dni_normalized es unico por organizacion, no
// globalmente -- dos organizaciones distintas pueden tener cada una un
// dirigente con el mismo DNI. Sin un selector de organizacion en el login
// (fuera de alcance de esta fase), no hay forma de saber cual de los dos
// quiso entrar: en vez de elegir uno arbitrariamente (podria hacer entrar
// a la persona equivocada a la organizacion equivocada, aunque el propio
// password nunca coincidiria por casualidad, es una ambiguedad real que
// hay que resolver a proposito, no en silencio), se devuelve "no
// encontrado" si hay mas de una coincidencia. Login por correo (el que
// usan platform_admin/superadmin/reports) no tiene este problema: el
// correo ya es global.
async function resolveLoginEmail(
  admin: ReturnType<typeof createAdminClient>,
  identifier: string
): Promise<string | null> {
  if (identifier.includes("@")) {
    return identifier;
  }

  const dni = normalizeDni(identifier);
  if (!dni) return null;

  const { data: individuals } = await admin
    .from("individuals")
    .select("id")
    .eq("dni_normalized", dni)
    .eq("position", "leader");

  if (!individuals || individuals.length !== 1) return null;

  const { data: leader } = await admin
    .from("leaders")
    .select("profile_id")
    .eq("id", individuals[0].id)
    .maybeSingle();

  if (!leader?.profile_id) return null;

  const { data: userResult } = await admin.auth.admin.getUserById(leader.profile_id);
  return userResult.user?.email ?? null;
}

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return { error: "Completá el correo (o DNI) y la contraseña." };
  }

  const email = await resolveLoginEmail(createAdminClient(), identifier);

  // Mismo mensaje generico tanto si el DNI/correo no existe como si la
  // contraseña esta mal: no se revela cual de los dos fallo.
  if (!email) {
    return { error: "El correo, DNI o la contraseña no son correctos." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "El correo, DNI o la contraseña no son correctos." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();
    return {
      error: "Esta cuenta todavía no tiene acceso configurado. Consultá con el administrador.",
    };
  }

  // platform_admin no tiene organizacion propia, no aplica este chequeo.
  // Todo otro rol siempre tiene organization_id (lo exige la Server Action
  // que crea la cuenta); el tipo es nullable solo por platform_admin.
  if (profile.role !== "platform_admin" && profile.organization_id) {
    const { data: organization } = await supabase
      .from("organizations")
      .select("is_active")
      .eq("id", profile.organization_id)
      .maybeSingle();

    if (organization && !organization.is_active) {
      await supabase.auth.signOut();
      return {
        error: "Esta organización fue desactivada. Consultá con el administrador de la plataforma.",
      };
    }
  }

  redirect(roleHomePath(profile.role));
}
