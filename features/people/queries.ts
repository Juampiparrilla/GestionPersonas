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
