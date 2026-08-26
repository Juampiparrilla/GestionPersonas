"use server";

import { redirect } from "next/navigation";

import { getRequestMeta } from "@/lib/request-meta";
import { createClient } from "@/lib/supabase/server";

export async function logout() {
  const supabase = await createClient();

  // Auditar ANTES de signOut(): fn_log_auth_event resuelve quien esta
  // haciendo la accion via auth.uid(), que deja de existir apenas se cierra
  // la sesion.
  const { ip, userAgent } = await getRequestMeta();
  await supabase.rpc("fn_log_auth_event", { p_action: "LOGOUT", p_ip: ip, p_user_agent: userAgent });

  await supabase.auth.signOut();
  redirect("/login");
}
