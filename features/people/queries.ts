import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export type PersonListItem = {
  id: string;
  fullName: string;
  dni: string;
  phone: string | null;
  address: string | null;
};

export async function listPeopleForPointer(pointerId: string): Promise<PersonListItem[]> {
  const supabase = await createClient();

  const [{ data: people, error: peopleError }, { data: individuals, error: individualsError }] =
    await Promise.all([
      supabase
        .from("registered_people")
        .select("id")
        .eq("pointer_id", pointerId)
        .eq("is_removed", false),
      supabase
        .from("individuals")
        .select("id, full_name, dni_display, phone, address")
        .eq("position", "person")
        .eq("status", "active"),
    ]);

  if (peopleError) throw new Error(peopleError.message);
  if (individualsError) throw new Error(individualsError.message);

  const individualsById = new Map((individuals ?? []).map((row) => [row.id, row]));

  const items: PersonListItem[] = [];
  for (const person of people ?? []) {
    const individual = individualsById.get(person.id);
    if (!individual) continue;
    items.push({
      id: person.id,
      fullName: individual.full_name,
      dni: individual.dni_display,
      phone: individual.phone,
      address: individual.address,
    });
  }

  return items.sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));
}

export type PersonPointerGroup = {
  pointerId: string;
  pointerName: string;
  leaderName: string;
  people: PersonListItem[];
};

// Vista de Superadmin: TODAS las personas registradas, agrupadas por
// puntero (con el dirigente indicado entre parentesis en el titulo). Incluye
// punteros sin personas registradas para dar el panorama completo.
export async function listAllPeopleGroupedByPointer(): Promise<PersonPointerGroup[]> {
  const session = await getSessionContext();
  if (!session || session.role !== "superadmin") return [];

  const supabase = await createClient();

  const [
    { data: leaderIndividuals, error: leadersError },
    { data: pointers, error: pointersError },
    { data: pointerIndividuals, error: pointerIndividualsError },
    { data: people, error: peopleError },
    { data: personIndividuals, error: personIndividualsError },
  ] = await Promise.all([
    supabase.from("individuals").select("id, full_name").eq("position", "leader").eq("status", "active"),
    supabase.from("pointers").select("id, leader_id").eq("is_removed", false),
    supabase.from("individuals").select("id, full_name").eq("position", "pointer").eq("status", "active"),
    supabase.from("registered_people").select("id, pointer_id").eq("is_removed", false),
    supabase
      .from("individuals")
      .select("id, full_name, dni_display, phone, address")
      .eq("position", "person")
      .eq("status", "active"),
  ]);

  if (leadersError) throw new Error(leadersError.message);
  if (pointersError) throw new Error(pointersError.message);
  if (pointerIndividualsError) throw new Error(pointerIndividualsError.message);
  if (peopleError) throw new Error(peopleError.message);
  if (personIndividualsError) throw new Error(personIndividualsError.message);

  const leaderNameById = new Map((leaderIndividuals ?? []).map((row) => [row.id, row.full_name]));
  const pointerNameById = new Map((pointerIndividuals ?? []).map((row) => [row.id, row.full_name]));
  const personIndividualById = new Map((personIndividuals ?? []).map((row) => [row.id, row]));

  const groups: PersonPointerGroup[] = (pointers ?? []).map((pointer) => ({
    pointerId: pointer.id,
    pointerName: pointerNameById.get(pointer.id) ?? "Puntero desconocido",
    leaderName: leaderNameById.get(pointer.leader_id) ?? "dirigente desconocido",
    people: [],
  }));
  const groupByPointerId = new Map(groups.map((group) => [group.pointerId, group]));

  for (const person of people ?? []) {
    const individual = personIndividualById.get(person.id);
    const group = groupByPointerId.get(person.pointer_id);
    if (!individual || !group) continue;
    group.people.push({
      id: individual.id,
      fullName: individual.full_name,
      dni: individual.dni_display,
      phone: individual.phone,
      address: individual.address,
    });
  }

  for (const group of groups) {
    group.people.sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));
  }

  return groups.sort((a, b) => {
    const leaderCompare = a.leaderName.localeCompare(b.leaderName, "es");
    return leaderCompare !== 0 ? leaderCompare : a.pointerName.localeCompare(b.pointerName, "es");
  });
}
