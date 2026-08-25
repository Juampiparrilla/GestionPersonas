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
export async function getSessionContext(): Promise<SessionContext | null> {
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
}
