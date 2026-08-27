import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { LeaderAccessStatus } from "@/types/domain";

export type LeaderListItem = {
  id: string;
  fullName: string;
  dni: string;
  phone: string | null;
  address: string | null;
  accessStatus: LeaderAccessStatus;
  pointerCount: number;
  personCount: number;
  vehicleCount: number;
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

  // Las 5 consultas son independientes entre si (ninguna necesita el
  // resultado de otra, solo se cruzan aca en JS despues) -- se agrupan en
  // un unico Promise.all en vez de 3 rondas sucesivas de ida y vuelta a
  // Supabase.
  const [
    { data: leaders, error: leadersError },
    { data: individuals, error: individualsError },
    { data: pointerRows },
    { data: vehicleRows },
    { data: peopleRows },
  ] = await Promise.all([
    supabase.from("leaders").select("id, access_status, profile_id").eq("is_removed", false),
    supabase
      .from("individuals")
      .select("id, full_name, dni_display, phone, address")
      .eq("position", "leader")
      .eq("status", "active"),
    supabase.from("pointers").select("id, leader_id").eq("is_removed", false),
    supabase.from("vehicles").select("leader_id").eq("is_removed", false),
    supabase.from("registered_people").select("pointer_id").eq("is_removed", false),
  ]);

  if (leadersError) throw new Error(leadersError.message);
  if (individualsError) throw new Error(individualsError.message);

  const pointerCountByLeader = new Map<string, number>();
  const leaderIdByPointer = new Map<string, string>();
  for (const row of pointerRows ?? []) {
    pointerCountByLeader.set(row.leader_id, (pointerCountByLeader.get(row.leader_id) ?? 0) + 1);
    leaderIdByPointer.set(row.id, row.leader_id);
  }

  const vehicleCountByLeader = new Map<string, number>();
  for (const row of vehicleRows ?? []) {
    vehicleCountByLeader.set(row.leader_id, (vehicleCountByLeader.get(row.leader_id) ?? 0) + 1);
  }

  const personCountByLeader = new Map<string, number>();
  for (const row of peopleRows ?? []) {
    const leaderId = leaderIdByPointer.get(row.pointer_id);
    if (!leaderId) continue;
    personCountByLeader.set(leaderId, (personCountByLeader.get(leaderId) ?? 0) + 1);
  }

  const individualsById = new Map((individuals ?? []).map((row) => [row.id, row]));

  // "Aceptada" = esa cuenta ya termino de elegir su contraseña (no solo
  // abrio el link) -- ver fn_mark_password_set y actualizar-contrasena.
  const profileIds = (leaders ?? [])
    .map((leader) => leader.profile_id)
    .filter((id): id is string => Boolean(id));

  const acceptedByProfile = new Map<string, boolean>();
  if (profileIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, password_set_at")
      .in("id", profileIds);
    for (const profile of profiles ?? []) {
      acceptedByProfile.set(profile.id, Boolean(profile.password_set_at));
    }
  }

  const items: LeaderListItem[] = [];
  for (const leader of leaders ?? []) {
    const individual = individualsById.get(leader.id);
    if (!individual) continue;
    items.push({
      id: leader.id,
      fullName: individual.full_name,
      dni: individual.dni_display,
      phone: individual.phone,
      address: individual.address,
      accessStatus: leader.access_status,
      pointerCount: pointerCountByLeader.get(leader.id) ?? 0,
      personCount: personCountByLeader.get(leader.id) ?? 0,
      vehicleCount: vehicleCountByLeader.get(leader.id) ?? 0,
      hasAccess: Boolean(leader.profile_id),
      accepted: leader.profile_id ? (acceptedByProfile.get(leader.profile_id) ?? false) : false,
    });
  }

  return items.sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));
}

export type LeaderBasics = { id: string; fullName: string };

export async function getLeaderBasics(leaderId: string): Promise<LeaderBasics | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("individuals")
    .select("id, full_name")
    .eq("id", leaderId)
    .eq("position", "leader")
    .maybeSingle();

  if (!data) return null;

  return { id: data.id, fullName: data.full_name };
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
