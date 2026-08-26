"use server";

import { revalidatePath } from "next/cache";

import { getRequestMeta } from "@/lib/request-meta";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { isValidDniFormat, normalizeDni } from "@/utils/dni";
import { friendlyRpcError } from "@/utils/rpc-errors";

export type CreatePersonState = { error: string | null; success: boolean };

export async function createPersonAction(
  pointerId: string,
  _prevState: CreatePersonState,
  formData: FormData
): Promise<CreatePersonState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const dni = String(formData.get("dni") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  if (!fullName || !dni) {
    return { error: "Completá el nombre y el DNI.", success: false };
  }
  if (!isValidDniFormat(dni)) {
    return { error: "El DNI no es válido.", success: false };
  }

  // pointerId ya viene explicito (bind del formulario, ver
  // CreatePersonForm) -- fn_create_person valida por si sola que ese
  // puntero pertenezca al dirigente correcto (el propio si es `leader`, o
  // cualquiera de la organizacion si es `superadmin`, caso de la carga
  // asistida). No hace falta resolver ni pasar un leaderId aparte acá.
  const session = await getSessionContext();
  if (!session || (session.role !== "leader" && session.role !== "superadmin")) {
    return { error: "No tenés permiso para hacer esto.", success: false };
  }

  const supabase = await createClient();
  const { ip, userAgent } = await getRequestMeta();

  const { error } = await supabase.rpc("fn_create_person", {
    p_pointer_id: pointerId,
    p_dni: normalizeDni(dni),
    p_full_name: fullName,
    p_phone: phone || null,
    p_address: address || null,
    p_ip: ip,
    p_user_agent: userAgent,
  });

  if (error) {
    return { error: friendlyRpcError(error.message), success: false };
  }

  revalidatePath(`/dirigente/punteros/${pointerId}`);
  revalidatePath("/dirigente/punteros");
  revalidatePath("/superadmin/carga-asistida");
  return { error: null, success: true };
}

export type ActionResult = { error: string | null };

export async function updatePersonAction(
  personId: string,
  fullName: string,
  phone: string | null,
  address: string | null
): Promise<ActionResult> {
  const supabase = await createClient();
  const { ip, userAgent } = await getRequestMeta();

  const { error } = await supabase.rpc("fn_update_person", {
    p_person_id: personId,
    p_full_name: fullName,
    p_phone: phone,
    p_address: address,
    p_ip: ip,
    p_user_agent: userAgent,
  });

  if (error) {
    return { error: friendlyRpcError(error.message) };
  }

  revalidatePath("/dirigente/punteros");
  return { error: null };
}

export async function removePersonAction(personId: string, pointerId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { ip, userAgent } = await getRequestMeta();

  const { error } = await supabase.rpc("fn_remove_person", {
    p_person_id: personId,
    p_ip: ip,
    p_user_agent: userAgent,
  });

  if (error) {
    return { error: friendlyRpcError(error.message) };
  }

  revalidatePath(`/dirigente/punteros/${pointerId}`);
  revalidatePath("/dirigente/punteros");
  return { error: null };
}
