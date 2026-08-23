"use server";

import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";

export type ForgotPasswordState = { message: string | null; error: string | null };

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { message: null, error: "Ingresá tu correo electrónico." };
  }

  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") ?? "";

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/actualizar-contrasena`,
  });

  // El mismo mensaje exista o no esa cuenta: no revelamos si un correo
  // esta registrado o no en el sistema.
  return {
    message: "Si ese correo está registrado, te enviamos un link para restablecer tu contraseña.",
    error: null,
  };
}
