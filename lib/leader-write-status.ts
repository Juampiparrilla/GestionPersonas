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
    supabase.from("leaders").select("access_status, is_removed").eq("id", leaderId).maybeSingle(),
  ]);

  // Un dirigente quitado cuenta como bloqueo individual: la base ya le impide
  // escribir (fn_can_leader_write), asi la pantalla no dice "Carga habilitada".
  if (leader?.access_status !== "active" || leader.is_removed) {
    return { canWrite: false, reason: "individual_block" };
  }
  if (settings?.loading_enabled === false) {
    return { canWrite: false, reason: "closed_global" };
  }
  return { canWrite: true, reason: null };
}
