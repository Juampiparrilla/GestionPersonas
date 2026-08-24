"use server";

import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

// Un solo campo busca DNI, nombre o patente a la vez, asi que primero hay
// que decidir la INTENCION de la busqueda en vez de probar los tres tipos
// de coincidencia siempre: si se usa `.includes()` con los digitos sueltos
// de una patente (ej. "AB123CD" -> "123") esos 3 digitos matchean cualquier
// DNI que los contenga en cualquier posicion, mezclando resultados de
// vehiculos con dirigentes/punteros que no tienen nada que ver. Clasificar
// primero (solo digitos = DNI, alfanumerico con letra y numero = patente,
// el resto = nombre) evita ese cruce.
type QueryIntent =
  | { type: "dni"; value: string }
  | { type: "plate"; value: string }
  | { type: "name"; value: string };

function classifyQuery(rawQuery: string): QueryIntent {
  const compact = rawQuery.replace(/[.\s]/g, "");
  if (/^\d+$/.test(compact)) {
    return { type: "dni", value: compact };
  }
  if (/^[A-Za-z0-9]+$/.test(compact) && /[A-Za-z]/.test(compact) && /[0-9]/.test(compact)) {
    return { type: "plate", value: compact.toUpperCase() };
  }
  return { type: "name", value: rawQuery.toLowerCase().trim() };
}

export type SearchResultKind = "leader" | "pointer" | "person" | "vehicle";

export type SearchResultItem = {
  kind: SearchResultKind;
  id: string;
  title: string;
  subtitle: string;
};

export type SearchState = {
  error: string | null;
  results: SearchResultItem[];
  query: string | null;
};

const initialState: SearchState = { error: null, results: [], query: null };

const KIND_LABEL: Record<SearchResultKind, string> = {
  leader: "Dirigente",
  pointer: "Puntero",
  person: "Persona registrada",
  vehicle: "Vehículo",
};

export async function searchDirectoryAction(
  _prevState: SearchState,
  formData: FormData
): Promise<SearchState> {
  const session = await getSessionContext();
  if (!session || (session.role !== "superadmin" && session.role !== "reports")) {
    return { ...initialState, error: "No tenés permiso para hacer esto." };
  }

  const query = String(formData.get("query") ?? "").trim();
  if (!query) return initialState;

  const supabase = await createClient();

  const [
    { data: individuals, error: individualsError },
    { data: pointers, error: pointersError },
    { data: people, error: peopleError },
    { data: vehicles, error: vehiclesError },
  ] = await Promise.all([
    supabase
      .from("individuals")
      .select("id, full_name, dni_display, dni_normalized, position")
      .eq("status", "active"),
    supabase.from("pointers").select("id, leader_id").eq("is_removed", false),
    supabase.from("registered_people").select("id, pointer_id").eq("is_removed", false),
    supabase
      .from("vehicles")
      .select(
        "id, leader_id, plate_display, plate_normalized, driver_full_name, driver_dni_normalized"
      )
      .eq("is_removed", false),
  ]);

  if (individualsError || pointersError || peopleError || vehiclesError) {
    return { ...initialState, error: "No pudimos completar la búsqueda." };
  }

  const individualsById = new Map((individuals ?? []).map((row) => [row.id, row]));
  const leaderIdByPointer = new Map((pointers ?? []).map((row) => [row.id, row.leader_id]));
  const pointerIdByPerson = new Map((people ?? []).map((row) => [row.id, row.pointer_id]));

  function leaderName(leaderId: string): string {
    return individualsById.get(leaderId)?.full_name ?? "dirigente desconocido";
  }

  const intent = classifyQuery(query);
  const dniQuery = intent.type === "dni" ? intent.value : "";
  const plateQuery = intent.type === "plate" ? intent.value : "";
  const nameQuery = intent.type === "name" ? intent.value : "";

  const results: SearchResultItem[] = [];

  for (const individual of individuals ?? []) {
    const dniMatch = dniQuery.length > 0 && individual.dni_normalized.includes(dniQuery);
    const nameMatch = nameQuery.length > 0 && individual.full_name.toLowerCase().includes(nameQuery);
    if (!dniMatch && !nameMatch) continue;

    if (individual.position === "leader") {
      results.push({
        kind: "leader",
        id: individual.id,
        title: individual.full_name,
        subtitle: `${KIND_LABEL.leader} · DNI ${individual.dni_display}`,
      });
    } else if (individual.position === "pointer") {
      const leaderId = leaderIdByPointer.get(individual.id);
      results.push({
        kind: "pointer",
        id: individual.id,
        title: individual.full_name,
        subtitle: `${KIND_LABEL.pointer} de ${leaderId ? leaderName(leaderId) : "dirigente desconocido"} · DNI ${individual.dni_display}`,
      });
    } else if (individual.position === "person") {
      const pointerId = pointerIdByPerson.get(individual.id);
      const pointerName = pointerId ? individualsById.get(pointerId)?.full_name ?? "puntero desconocido" : "puntero desconocido";
      const leaderId = pointerId ? leaderIdByPointer.get(pointerId) : undefined;
      results.push({
        kind: "person",
        id: individual.id,
        title: individual.full_name,
        subtitle: `${KIND_LABEL.person} de ${pointerName}${leaderId ? ` (puntero de ${leaderName(leaderId)})` : ""} · DNI ${individual.dni_display}`,
      });
    }
  }

  for (const vehicle of vehicles ?? []) {
    const plateMatch = plateQuery.length > 0 && vehicle.plate_normalized.includes(plateQuery);
    const driverDniMatch = dniQuery.length > 0 && vehicle.driver_dni_normalized.includes(dniQuery);
    const driverNameMatch = nameQuery.length > 0 && vehicle.driver_full_name.toLowerCase().includes(nameQuery);
    if (!plateMatch && !driverDniMatch && !driverNameMatch) continue;

    results.push({
      kind: "vehicle",
      id: vehicle.id,
      title: `${vehicle.plate_display} · ${vehicle.driver_full_name}`,
      subtitle: `${KIND_LABEL.vehicle} de ${leaderName(vehicle.leader_id)} · DNI conductor ${vehicle.driver_dni_normalized}`,
    });
  }

  return { error: null, results, query };
}
