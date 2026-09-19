"use server";

import { formatDayMonth } from "@/features/audit/dates";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { isValidDniFormat, normalizeDni } from "@/utils/dni";

export type DniMatch =
  | { found: false }
  | {
      found: true;
      name: string;
      kindLabel: string;
      // "12/09" -- dia y mes en que se cargo.
      loadedOn: string;
      // Ficha donde esta cargado; null si quien consulta no tiene una a
      // donde ir (ej. es el propio dirigente).
      href: string | null;
    };

const KIND_LABEL = { leader: "Dirigente", pointer: "Puntero", person: "Persona" } as const;

// Consulta si un DNI ya esta cargado y activo en la organizacion, para
// avisarlo mientras se escribe (antes de guardar) en vez de recien al
// fallar el alta. La consulta es con la sesion de quien mira (RLS): el
// Administrador de Organizacion ve toda su organizacion; un dirigente solo
// ve lo suyo -- que un DNI este cargado por OTRO dirigente no se le revela
// aca (se le avisa recien al guardar, sin decir quien lo tiene).
export async function lookupDniAction(rawDni: string): Promise<DniMatch> {
  const session = await getSessionContext();
  if (!session || !session.organizationId) return { found: false };
  if (session.role !== "leader" && session.role !== "superadmin") return { found: false };

  const dni = normalizeDni(rawDni);
  if (!isValidDniFormat(dni)) return { found: false };

  const supabase = await createClient();

  const { data: individual } = await supabase
    .from("individuals")
    .select("id, full_name, position, created_at")
    .eq("organization_id", session.organizationId)
    .eq("dni_normalized", dni)
    .eq("status", "active")
    .maybeSingle();

  if (!individual || !individual.position) return { found: false };

  const kind = individual.position as keyof typeof KIND_LABEL;

  // Pointers / registered_people cuelgan de un dirigente: se busca a cual
  // para poder llevar a la ficha correcta.
  let leaderId: string | null = null;
  let pointerId: string | null = null;
  if (kind === "leader") {
    leaderId = individual.id;
  } else if (kind === "pointer") {
    pointerId = individual.id;
    const { data } = await supabase
      .from("pointers")
      .select("leader_id")
      .eq("id", individual.id)
      .maybeSingle();
    leaderId = data?.leader_id ?? null;
  } else {
    const { data: person } = await supabase
      .from("registered_people")
      .select("pointer_id")
      .eq("id", individual.id)
      .maybeSingle();
    pointerId = person?.pointer_id ?? null;
    if (pointerId) {
      const { data: pointer } = await supabase
        .from("pointers")
        .select("leader_id")
        .eq("id", pointerId)
        .maybeSingle();
      leaderId = pointer?.leader_id ?? null;
    }
  }

  let href: string | null = null;
  if (session.role === "superadmin") {
    href = leaderId ? `/superadmin/dirigentes/${leaderId}` : null;
  } else if (pointerId) {
    href = `/dirigente/punteros/${pointerId}`;
  }

  return {
    found: true,
    name: individual.full_name,
    kindLabel: KIND_LABEL[kind],
    loadedOn: formatDayMonth(individual.created_at),
    href,
  };
}
