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

  const [{ data: pointers, error: pointersError }, { data: individuals, error: individualsError }] =
    await Promise.all([
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
    ]);

  if (pointersError) throw new Error(pointersError.message);
  if (individualsError) throw new Error(individualsError.message);

  const { data: peopleRows } = await supabase
    .from("registered_people")
    .select("pointer_id")
    .eq("is_removed", false);

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
