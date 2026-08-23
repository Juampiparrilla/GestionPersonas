import { getSessionContext } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { LeaderAccessStatus } from "@/types/domain";

export type LeaderListItem = {
  id: string;
  fullName: string;
  dni: string;
  phone: string | null;
  accessStatus: LeaderAccessStatus;
  pointerCount: number;
  hasAccess: boolean;
  accepted: boolean;
};

// No se usa un embed de Supabase (leaders -> individuals) porque leaders.id
// = individuals.id (no hay una FK "normal" con nombre propio que PostgREST
// pueda resolver de forma directa desde el tipado a mano de este proyecto).
// En cambio se traen ambas tablas por separado y se cruzan por id: es
// exactamente equivalente y mas simple de tipar correctamente.
export async function listActiveLeaders(): Promise<LeaderListItem[]> {
  const session = await getSessionContext();
  if (!session || session.role !== "superadmin") return [];

  const supabase = await createClient();

  const [{ data: leaders, error: leadersError }, { data: individuals, error: individualsError }] =
    await Promise.all([
      supabase.from("leaders").select("id, access_status, profile_id").eq("is_removed", false),
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

  // "Aceptada" = la cuenta ya inicio sesion alguna vez. Solo se puede saber
  // via el Admin API (last_sign_in_at no esta expuesto por el cliente
  // normal), por eso esta unica parte usa el cliente con service_role.
  const admin = createAdminClient();
  const acceptedByLeader = new Map<string, boolean>();
  await Promise.all(
    (leaders ?? [])
      .filter((leader): leader is typeof leader & { profile_id: string } => Boolean(leader.profile_id))
      .map(async (leader) => {
        const { data } = await admin.auth.admin.getUserById(leader.profile_id);
        acceptedByLeader.set(leader.id, Boolean(data.user?.last_sign_in_at));
      })
  );

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
      hasAccess: Boolean(leader.profile_id),
      accepted: acceptedByLeader.get(leader.id) ?? false,
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
