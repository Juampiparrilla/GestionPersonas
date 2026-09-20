import { cache } from "react";

import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

// Conteos de la barra lateral del Dirigente (punteros y vehiculos propios).
export const getLeaderCounts = cache(async () => {
  const session = await getSessionContext();
  if (!session || session.role !== "leader" || !session.leaderId) {
    return { pointers: 0, vehicles: 0 };
  }

  const supabase = await createClient();
  const [pointers, vehicles] = await Promise.all([
    supabase
      .from("pointers")
      .select("id", { count: "exact", head: true })
      .eq("leader_id", session.leaderId)
      .eq("is_removed", false),
    supabase
      .from("vehicles")
      .select("id", { count: "exact", head: true })
      .eq("leader_id", session.leaderId)
      .eq("is_removed", false),
  ]);

  return { pointers: pointers.count ?? 0, vehicles: vehicles.count ?? 0 };
});
