import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/domain";

export type SessionContext = {
  profileId: string;
  // null solo para role === "platform_admin": no pertenece a ninguna
  // organización. Todo el resto de los roles siempre la tiene.
  organizationId: string | null;
  role: UserRole;
  leaderId: string | null;
  fullName: string;
};

// Contexto del usuario autenticado, para usar en Server Components/Actions.
// Devuelve null si no hay sesion o si el usuario no tiene un `profiles`
// asociado (no debe pasar en uso normal, pero se contempla explicitamente
// en vez de asumir que siempre existe).
//
// Envuelta en cache() de React: sin esto, cada layout de rol (superadmin,
// dirigente, plataforma, reportes) la llama para validar el rol, y despues
// la pagina que envuelve la vuelve a llamar -- duplicando el round-trip a
// Supabase (auth.getUser() + select de profiles) en CADA navegacion.
// cache() memoiza por el arbol de render de un mismo request, asi que la
// segunda llamada (misma funcion, mismos argumentos -- acá ninguno) es
// gratis, sin tocar ningun call site existente.
export const getSessionContext = cache(async (): Promise<SessionContext | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, organization_id, role, leader_id, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  return {
    profileId: profile.id,
    organizationId: profile.organization_id,
    role: profile.role,
    leaderId: profile.leader_id,
    fullName: profile.full_name,
  };
});
