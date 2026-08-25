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

// Para el reporte "Personas registradas" del dirigente desde Mis Punteros:
// todos sus punteros con las personas de cada uno, sin el nivel de dirigente
// (ya se sabe quien es por la sesion).
export async function listMyPeopleGroupedByPointer(): Promise<PersonPointerGroup[]> {
  const session = await getSessionContext();
  if (!session || session.role !== "leader" || !session.leaderId) return [];

  const supabase = await createClient();

  const [{ data: pointers, error: pointersError }, { data: pointerIndividuals, error: pointerIndividualsError }] =
    await Promise.all([
      supabase.from("pointers").select("id").eq("leader_id", session.leaderId).eq("is_removed", false),
      supabase.from("individuals").select("id, full_name").eq("position", "pointer").eq("status", "active"),
    ]);

  if (pointersError) throw new Error(pointersError.message);
  if (pointerIndividualsError) throw new Error(pointerIndividualsError.message);

  const pointerIndividualById = new Map((pointerIndividuals ?? []).map((row) => [row.id, row]));

  const pointerGroups: PersonPointerGroup[] = [];
  const pointerGroupByPointerId = new Map<string, PersonPointerGroup>();
  for (const pointer of pointers ?? []) {
    const individual = pointerIndividualById.get(pointer.id);
    if (!individual) continue;
    const pointerGroup: PersonPointerGroup = { pointerId: pointer.id, pointerName: individual.full_name, people: [] };
    pointerGroups.push(pointerGroup);
    pointerGroupByPointerId.set(pointer.id, pointerGroup);
  }

  if (pointerGroups.length > 0) {
    const [{ data: people, error: peopleError }, { data: personIndividuals, error: personIndividualsError }] =
      await Promise.all([
        supabase.from("registered_people").select("id, pointer_id").eq("is_removed", false),
        supabase
          .from("individuals")
          .select("id, full_name, dni_display, phone, address")
          .eq("position", "person")
          .eq("status", "active"),
      ]);

    if (peopleError) throw new Error(peopleError.message);
    if (personIndividualsError) throw new Error(personIndividualsError.message);

    const personIndividualById = new Map((personIndividuals ?? []).map((row) => [row.id, row]));

    for (const person of people ?? []) {
      const individual = personIndividualById.get(person.id);
      const pointerGroup = pointerGroupByPointerId.get(person.pointer_id);
      if (!individual || !pointerGroup) continue;
      pointerGroup.people.push({
        id: individual.id,
        fullName: individual.full_name,
        dni: individual.dni_display,
        phone: individual.phone,
        address: individual.address,
      });
    }
  }

  pointerGroups.sort((a, b) => a.pointerName.localeCompare(b.pointerName, "es"));
  for (const pointerGroup of pointerGroups) {
    pointerGroup.people.sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));
  }

  return pointerGroups;
}

export type PersonPointerGroup = {
  pointerId: string;
  pointerName: string;
  people: PersonListItem[];
};

export type PersonLeaderGroup = {
  leaderId: string;
  leaderName: string;
  pointerGroups: PersonPointerGroup[];
};

// Vista de Superadmin: TODAS las personas registradas, anidadas en 3
// niveles -- dirigente > sus punteros > las personas de cada puntero -- en
// vez de una lista plana de punteros repitiendo el nombre del dirigente en
// cada tarjeta. Incluye dirigentes sin punteros y punteros sin personas
// para dar el panorama completo.
export async function listAllPeopleGroupedByLeader(): Promise<PersonLeaderGroup[]> {
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

  const pointerIndividualById = new Map((pointerIndividuals ?? []).map((row) => [row.id, row]));
  const personIndividualById = new Map((personIndividuals ?? []).map((row) => [row.id, row]));

  const leaderGroups: PersonLeaderGroup[] = (leaderIndividuals ?? []).map((leader) => ({
    leaderId: leader.id,
    leaderName: leader.full_name,
    pointerGroups: [],
  }));
  const leaderGroupById = new Map(leaderGroups.map((group) => [group.leaderId, group]));

  const pointerGroupByPointerId = new Map<string, PersonPointerGroup>();
  for (const pointer of pointers ?? []) {
    const individual = pointerIndividualById.get(pointer.id);
    const leaderGroup = leaderGroupById.get(pointer.leader_id);
    if (!individual || !leaderGroup) continue;
    const pointerGroup: PersonPointerGroup = {
      pointerId: pointer.id,
      pointerName: individual.full_name,
      people: [],
    };
    leaderGroup.pointerGroups.push(pointerGroup);
    pointerGroupByPointerId.set(pointer.id, pointerGroup);
  }

  for (const person of people ?? []) {
    const individual = personIndividualById.get(person.id);
    const pointerGroup = pointerGroupByPointerId.get(person.pointer_id);
    if (!individual || !pointerGroup) continue;
    pointerGroup.people.push({
      id: individual.id,
      fullName: individual.full_name,
      dni: individual.dni_display,
      phone: individual.phone,
      address: individual.address,
    });
  }

  for (const leaderGroup of leaderGroups) {
    leaderGroup.pointerGroups.sort((a, b) => a.pointerName.localeCompare(b.pointerName, "es"));
    for (const pointerGroup of leaderGroup.pointerGroups) {
      pointerGroup.people.sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));
    }
  }

  return leaderGroups.sort((a, b) => a.leaderName.localeCompare(b.leaderName, "es"));
}
