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
// Nota: dni_normalized es unico por organizacion, no globalmente. Con una
// sola organizacion esto no es ambiguo; si en el futuro hay mas de una, esta
// funcion necesitaria una forma de saber a que organizacion pertenece quien
// esta iniciando sesion (ej. un subdominio por organizacion) antes de buscar
// por DNI.
async function resolveLoginEmail(
  admin: ReturnType<typeof createAdminClient>,
  identifier: string
): Promise<string | null> {
  if (identifier.includes("@")) {
    return identifier;
  }

  const dni = normalizeDni(identifier);
  if (!dni) return null;

  const { data: individual } = await admin
    .from("individuals")
    .select("id")
    .eq("dni_normalized", dni)
    .eq("position", "leader")
    .maybeSingle();

  if (!individual) return null;

  const { data: leader } = await admin
    .from("leaders")
    .select("profile_id")
    .eq("id", individual.id)
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
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();
    return {
      error: "Esta cuenta todavía no tiene acceso configurado. Consultá con el administrador.",
    };
  }

  redirect(roleHomePath(profile.role));
}
