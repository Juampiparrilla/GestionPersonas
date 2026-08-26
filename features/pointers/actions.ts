"use server";

import { revalidatePath } from "next/cache";

import { getRequestMeta } from "@/lib/request-meta";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { isValidDniFormat, normalizeDni } from "@/utils/dni";
import { friendlyRpcError } from "@/utils/rpc-errors";

export type CreatePointerState = { error: string | null; success: boolean };

export async function createPointerAction(
  _prevState: CreatePointerState,
  formData: FormData
): Promise<CreatePointerState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const dni = String(formData.get("dni") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  // Solo lo llena CreatePointerForm cuando lo usa la carga asistida del
  // Administrador de Organización (ver features/carga-asistida) -- un
  // dirigente jamas manda este campo, siempre usa el suyo propio.
  const targetLeaderId = String(formData.get("leaderId") ?? "").trim();

  if (!fullName || !dni) {
    return { error: "Completá el nombre y el DNI.", success: false };
  }
  if (!isValidDniFormat(dni)) {
    return { error: "El DNI no es válido.", success: false };
  }

  const session = await getSessionContext();
  if (!session) {
    return { error: "No tenés permiso para hacer esto.", success: false };
  }

  let leaderId: string;
  if (session.role === "leader" && session.leaderId) {
    leaderId = session.leaderId;
  } else if (session.role === "superadmin" && targetLeaderId) {
    // fn_create_pointer ya valida que ese dirigente pertenezca a la
    // organizacion del que llama -- no hace falta repetir ese chequeo acá.
    leaderId = targetLeaderId;
  } else {
    return { error: "No tenés permiso para hacer esto.", success: false };
  }

  const supabase = await createClient();
  const { ip, userAgent } = await getRequestMeta();

  const { error } = await supabase.rpc("fn_create_pointer", {
    p_leader_id: leaderId,
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

  revalidatePath("/dirigente/punteros");
  revalidatePath("/superadmin/carga-asistida");
  return { error: null, success: true };
}

export type ActionResult = { error: string | null };

export async function updatePointerAction(
  pointerId: string,
  fullName: string,
  phone: string | null,
  address: string | null
): Promise<ActionResult> {
  const supabase = await createClient();
  const { ip, userAgent } = await getRequestMeta();

  const { error } = await supabase.rpc("fn_update_pointer", {
    p_pointer_id: pointerId,
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

export async function removePointerAction(pointerId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { ip, userAgent } = await getRequestMeta();

  const { error } = await supabase.rpc("fn_remove_pointer", {
    p_pointer_id: pointerId,
    p_ip: ip,
    p_user_agent: userAgent,
  });

  if (error) {
    return { error: friendlyRpcError(error.message) };
  }

  revalidatePath("/dirigente/punteros");
  return { error: null };
}
