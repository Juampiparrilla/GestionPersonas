import { createClient } from "@/lib/supabase/server";
import type { LeaderAccessStatus } from "@/types/domain";

export type LeaderListItem = {
  id: string;
  fullName: string;
  dni: string;
  phone: string | null;
  accessStatus: LeaderAccessStatus;
  pointerCount: number;
};

// No se usa un embed de Supabase (leaders -> individuals) porque leaders.id
// = individuals.id (no hay una FK "normal" con nombre propio que PostgREST
// pueda resolver de forma directa desde el tipado a mano de este proyecto).
// En cambio se traen ambas tablas por separado y se cruzan por id: es
// exactamente equivalente y mas simple de tipar correctamente.
export async function listActiveLeaders(): Promise<LeaderListItem[]> {
  const supabase = await createClient();

  const [{ data: leaders, error: leadersError }, { data: individuals, error: individualsError }] =
    await Promise.all([
      supabase.from("leaders").select("id, access_status").eq("is_removed", false),
      supabase
        .from("individuals")
        .select("id, full_name, dni_display, phone")
        .eq("position", "leader")
        .eq("status", "active"),
    ]);

  if (leadersError) throw new Error(leadersError.message);
  if (individualsError) throw new Error(individualsError.message);

  const { data: pointerRows } = await supabase
    .from("pointers")
    .select("leader_id")
    .eq("is_removed", false);

  const pointerCountByLeader = new Map<string, number>();
  for (const row of pointerRows ?? []) {
    pointerCountByLeader.set(row.leader_id, (pointerCountByLeader.get(row.leader_id) ?? 0) + 1);
  }

  const individualsById = new Map((individuals ?? []).map((row) => [row.id, row]));

  const items: LeaderListItem[] = [];
  for (const leader of leaders ?? []) {
    const individual = individualsById.get(leader.id);
    if (!individual) continue;
    items.push({
      id: leader.id,
      fullName: individual.full_name,
      dni: individual.dni_display,
      phone: individual.phone,
      accessStatus: leader.access_status,
      pointerCount: pointerCountByLeader.get(leader.id) ?? 0,
    });
  }

  return items.sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));
}

export async function getSuperadminStats() {
  const supabase = await createClient();

  const [leaders, pointers, people, vehicles] = await Promise.all([
    supabase.from("leaders").select("id", { count: "exact", head: true }).eq("is_removed", false),
    supabase.from("pointers").select("id", { count: "exact", head: true }).eq("is_removed", false),
    supabase
      .from("registered_people")
      .select("id", { count: "exact", head: true })
      .eq("is_removed", false),
    supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("is_removed", false),
  ]);

  return {
    leaders: leaders.count ?? 0,
    pointers: pointers.count ?? 0,
    people: people.count ?? 0,
    vehicles: vehicles.count ?? 0,
  };
}
