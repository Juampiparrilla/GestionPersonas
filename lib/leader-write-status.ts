import { createClient } from "@/lib/supabase/server";

export type LeaderWriteStatus = {
  canWrite: boolean;
  reason: "closed_global" | "individual_block" | null;
};

// Regla de permiso efectivo (igual que fn_can_leader_write en la base): el
// bloqueo individual nunca afloja el cierre global, solo puede sumar
// restriccion. Se recalcula siempre del lado del servidor -- la RPC vuelve
// a chequear esto igual, esto es solo para decidir que UI mostrar.
export async function getLeaderWriteStatus(
  organizationId: string,
  leaderId: string
): Promise<LeaderWriteStatus> {
  const supabase = await createClient();

  const [{ data: settings }, { data: leader }] = await Promise.all([
    supabase
      .from("system_settings")
      .select("loading_enabled")
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase.from("leaders").select("access_status").eq("id", leaderId).maybeSingle(),
  ]);

  if (leader?.access_status !== "active") {
    return { canWrite: false, reason: "individual_block" };
  }
  if (settings?.loading_enabled === false) {
    return { canWrite: false, reason: "closed_global" };
  }
  return { canWrite: true, reason: null };
}
