"use server";

import { revalidatePath } from "next/cache";

import { getRequestMeta } from "@/lib/request-meta";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { normalizeDni } from "@/utils/dni";
import { collectFieldErrors, rpcFieldErrors, type FieldErrors } from "@/utils/form-errors";
import { normalizePhone } from "@/utils/phone";
import { friendlyRpcError } from "@/utils/rpc-errors";
import { validateDni, validateFullName, validatePhone } from "@/utils/validation";

export type CreatePointerState = { error: string | null; success: boolean; fieldErrors?: FieldErrors };

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

  const fieldErrors = collectFieldErrors({
    fullName: validateFullName(fullName),
    dni: validateDni(dni),
    phone: validatePhone(phone),
  });
  if (fieldErrors) {
    return { error: null, success: false, fieldErrors };
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
    p_phone: normalizePhone(phone),
    p_address: address || null,
    p_ip: ip,
    p_user_agent: userAgent,
  });

  if (error) {
    const rpcErrors = rpcFieldErrors(error.message);
    if (rpcErrors) {
      return { error: null, success: false, fieldErrors: rpcErrors };
    }
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
  const phoneError = phone ? validatePhone(phone) : null;
  if (phoneError) {
    return { error: phoneError };
  }

  const supabase = await createClient();
  const { ip, userAgent } = await getRequestMeta();

  const { error } = await supabase.rpc("fn_update_pointer", {
    p_pointer_id: pointerId,
    p_full_name: fullName,
    p_phone: phone ? normalizePhone(phone) : null,
    p_address: address,
    p_ip: ip,
    p_user_agent: userAgent,
  });

  if (error) {
    return { error: friendlyRpcError(error.message) };
  }

  revalidatePath("/dirigente/punteros");
  revalidatePath(`/dirigente/punteros/${pointerId}`);
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
