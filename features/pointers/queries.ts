import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export type PointerListItem = {
  id: string;
  fullName: string;
  dni: string;
  phone: string | null;
  address: string | null;
  peopleCount: number;
};

// Igual que con los dirigentes: no se usa un embed pointers->individuals
// porque pointers.id = individuals.id (no hay una FK "normal" con nombre
// propio). Se traen ambas por separado y se cruzan por id.
export async function listMyPointers(): Promise<PointerListItem[]> {
  const session = await getSessionContext();
  if (!session || session.role !== "leader" || !session.leaderId) return [];

  const supabase = await createClient();

  const [
    { data: pointers, error: pointersError },
    { data: individuals, error: individualsError },
    { data: peopleRows },
  ] = await Promise.all([
    supabase
      .from("pointers")
      .select("id")
      .eq("leader_id", session.leaderId)
      .eq("is_removed", false),
    supabase
      .from("individuals")
      .select("id, full_name, dni_display, phone, address")
      .eq("position", "pointer")
      .eq("status", "active"),
    supabase.from("registered_people").select("pointer_id").eq("is_removed", false),
  ]);

  if (pointersError) throw new Error(pointersError.message);
  if (individualsError) throw new Error(individualsError.message);

  const peopleCountByPointer = new Map<string, number>();
  for (const row of peopleRows ?? []) {
    peopleCountByPointer.set(row.pointer_id, (peopleCountByPointer.get(row.pointer_id) ?? 0) + 1);
  }

  const individualsById = new Map((individuals ?? []).map((row) => [row.id, row]));

  const items: PointerListItem[] = [];
  for (const pointer of pointers ?? []) {
    const individual = individualsById.get(pointer.id);
    if (!individual) continue;
    items.push({
      id: pointer.id,
      fullName: individual.full_name,
      dni: individual.dni_display,
      phone: individual.phone,
      address: individual.address,
      peopleCount: peopleCountByPointer.get(pointer.id) ?? 0,
    });
  }

  return items.sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));
}

export type PointerLeaderGroup = {
  leaderId: string;
  leaderName: string;
  pointers: PointerListItem[];
};

// Vista de Superadmin: TODOS los punteros de la organizacion, agrupados por
// dirigente (orden alfabetico de dirigente, y de puntero dentro de cada
// grupo). Incluye dirigentes sin punteros para que se vea el panorama
// completo, no solo los que ya tienen carga.
export async function listAllPointersGroupedByLeader(): Promise<PointerLeaderGroup[]> {
  const session = await getSessionContext();
  if (!session || session.role !== "superadmin") return [];

  const supabase = await createClient();

  const [
    { data: leaderIndividuals, error: leadersError },
    { data: pointers, error: pointersError },
    { data: pointerIndividuals, error: individualsError },
    { data: peopleRows },
  ] = await Promise.all([
    supabase.from("individuals").select("id, full_name").eq("position", "leader").eq("status", "active"),
    supabase.from("pointers").select("id, leader_id").eq("is_removed", false),
    supabase
      .from("individuals")
      .select("id, full_name, dni_display, phone, address")
      .eq("position", "pointer")
      .eq("status", "active"),
    supabase.from("registered_people").select("pointer_id").eq("is_removed", false),
  ]);

  if (leadersError) throw new Error(leadersError.message);
  if (pointersError) throw new Error(pointersError.message);
  if (individualsError) throw new Error(individualsError.message);

  const peopleCountByPointer = new Map<string, number>();
  for (const row of peopleRows ?? []) {
    peopleCountByPointer.set(row.pointer_id, (peopleCountByPointer.get(row.pointer_id) ?? 0) + 1);
  }

  const pointerIndividualById = new Map((pointerIndividuals ?? []).map((row) => [row.id, row]));

  const groups: PointerLeaderGroup[] = (leaderIndividuals ?? []).map((leader) => ({
    leaderId: leader.id,
    leaderName: leader.full_name,
    pointers: [],
  }));
  const groupByLeaderId = new Map(groups.map((group) => [group.leaderId, group]));

  for (const pointer of pointers ?? []) {
    const individual = pointerIndividualById.get(pointer.id);
    const group = groupByLeaderId.get(pointer.leader_id);
    if (!individual || !group) continue;
    group.pointers.push({
      id: individual.id,
      fullName: individual.full_name,
      dni: individual.dni_display,
      phone: individual.phone,
      address: individual.address,
      peopleCount: peopleCountByPointer.get(pointer.id) ?? 0,
    });
  }

  for (const group of groups) {
    group.pointers.sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));
  }

  return groups.sort((a, b) => a.leaderName.localeCompare(b.leaderName, "es"));
}

export type PointerBasics = { id: string; fullName: string; dni: string; leaderId: string };

// Para la pantalla de detalle: nombre del puntero + confirmar que le
// pertenece a quien esta mirando (si no le pertenece, RLS ya hace que la
// fila ni aparezca, esto solo maneja el caso "no existe / no es mio").
export async function getPointerBasics(pointerId: string): Promise<PointerBasics | null> {
  const supabase = await createClient();

  const [{ data: pointer }, { data: individual }] = await Promise.all([
    supabase
      .from("pointers")
      .select("id, leader_id")
      .eq("id", pointerId)
      .eq("is_removed", false)
      .maybeSingle(),
    supabase.from("individuals").select("full_name, dni_display").eq("id", pointerId).maybeSingle(),
  ]);

  if (!pointer || !individual) return null;

  return {
    id: pointer.id,
    leaderId: pointer.leader_id,
    fullName: individual.full_name,
    dni: individual.dni_display,
  };
}
