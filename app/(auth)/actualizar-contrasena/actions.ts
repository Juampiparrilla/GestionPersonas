"use server";

import { redirect } from "next/navigation";

import { roleHomePath } from "@/lib/routes";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export type UpdatePasswordState = { error: string | null };

export async function updatePassword(
  _prevState: UpdatePasswordState,
  formData: FormData
): Promise<UpdatePasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8) {
    return { error: "La contraseña tiene que tener al menos 8 caracteres." };
  }
  if (password !== confirmPassword) {
    return { error: "Las dos contraseñas no coinciden." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return {
      error: "No pudimos actualizar la contraseña. Pedí un nuevo link e intentá de nuevo.",
    };
  }

  const session = await getSessionContext();
  redirect(session ? roleHomePath(session.role) : "/login");
}
