"use server";

import { revalidatePath } from "next/cache";

import { grantLeaderAccess } from "@/lib/leader-access";
import { getRequestMeta } from "@/lib/request-meta";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { LeaderAccessStatus } from "@/types/domain";
import { normalizeDni } from "@/utils/dni";
import { collectFieldErrors, rpcFieldErrors, type FieldErrors } from "@/utils/form-errors";
import { normalizePhone } from "@/utils/phone";
import { friendlyRpcError } from "@/utils/rpc-errors";
import { validateDni, validateFullName, validatePhone } from "@/utils/validation";

export type CreateLeaderState = { error: string | null; success: boolean; fieldErrors?: FieldErrors };

export async function createLeaderAction(
  _prevState: CreateLeaderState,
  formData: FormData
): Promise<CreateLeaderState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const dni = String(formData.get("dni") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  const fieldErrors = collectFieldErrors({
    fullName: validateFullName(fullName),
    dni: validateDni(dni),
    phone: validatePhone(phone),
  });
  if (fieldErrors) {
    return { error: null, success: false, fieldErrors };
  }
  // Formato de pantalla ("381 476-3833"); null si no se cargo telefono.
  const phoneValue = normalizePhone(phone);

  const session = await getSessionContext();
  if (!session || session.role !== "superadmin") {
    return { error: "No tenés permiso para hacer esto.", success: false };
  }

  const supabase = await createClient();
  const { ip, userAgent } = await getRequestMeta();

  const { data: leaderId, error } = await supabase.rpc("fn_create_leader", {
    p_dni: normalizeDni(dni),
    p_full_name: fullName,
    p_phone: phoneValue,
    p_profile_id: null,
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

  revalidatePath("/superadmin/dirigentes");

  // El dirigente ya quedo creado; el acceso se genera siempre en silencio,
  // asi el boton de invitar/reenviar de la lista ya tiene algo para mandar.
  // Si esto falla, no es un error para el usuario: el dirigente igual quedo
  // creado, y el acceso se puede generar despues desde la lista.
  const access = await grantLeaderAccess({
    supabase,
    leaderId: leaderId as string,
    fullName,
    phone: phoneValue,
    dniNormalized: normalizeDni(dni),
    dniForMessage: dni,
    organizationId: session.organizationId!,
    existingProfileId: null,
    ip,
    userAgent,
  });

  if (access.ok) {
    await supabase.rpc("fn_log_invitation_sent", {
      p_leader_id: leaderId as string,
      p_ip: ip,
      p_user_agent: userAgent,
    });
  }

  return { error: null, success: true };
}

export type InviteResult =
  | { ok: false; error: string }
  | { ok: true; whatsappLink: string | null; shareMessage: string };

export async function resendInviteAction(leaderId: string): Promise<InviteResult> {
  const session = await getSessionContext();
  if (!session || session.role !== "superadmin") {
    return { ok: false, error: "No tenés permiso para hacer esto." };
  }

  const supabase = await createClient();
  const { ip, userAgent } = await getRequestMeta();

  // Con el cliente normal (no admin): las policies de individuals/leaders ya
  // exigen que pertenezcan a la organizacion de quien llama, asi que un
  // superadmin no puede generar accesos para dirigentes de otra
  // organizacion pasando un id ajeno.
  const [{ data: individual }, { data: leader }] = await Promise.all([
    supabase
      .from("individuals")
      .select("dni_normalized, dni_display, full_name, phone")
      .eq("id", leaderId)
      .maybeSingle(),
    supabase.from("leaders").select("profile_id").eq("id", leaderId).maybeSingle(),
  ]);

  if (!individual || !leader) {
    return { ok: false, error: "No encontramos a este dirigente." };
  }

  const access = await grantLeaderAccess({
    supabase,
    leaderId,
    fullName: individual.full_name,
    phone: individual.phone,
    dniNormalized: individual.dni_normalized,
    dniForMessage: individual.dni_display,
    organizationId: session.organizationId!,
    existingProfileId: leader.profile_id,
    ip,
    userAgent,
  });

  if (!access.ok) {
    return { ok: false, error: access.error };
  }

  await supabase.rpc("fn_log_invitation_sent", { p_leader_id: leaderId, p_ip: ip, p_user_agent: userAgent });

  revalidatePath("/superadmin/dirigentes");
  return { ok: true, whatsappLink: access.whatsappLink, shareMessage: access.shareMessage };
}

export type ActionResult = { error: string | null };

export async function setLeaderAccessStatusAction(
  leaderId: string,
  status: LeaderAccessStatus
): Promise<ActionResult> {
  const supabase = await createClient();
  const { ip, userAgent } = await getRequestMeta();

  const { error } = await supabase.rpc("fn_set_leader_access_status", {
    p_leader_id: leaderId,
    p_status: status,
    p_ip: ip,
    p_user_agent: userAgent,
  });

  if (error) {
    return { error: friendlyRpcError(error.message) };
  }

  revalidatePath("/superadmin/dirigentes");
  return { error: null };
}

export async function updateLeaderAction(
  leaderId: string,
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

  const { error } = await supabase.rpc("fn_update_leader", {
    p_leader_id: leaderId,
    p_full_name: fullName,
    p_phone: phone ? normalizePhone(phone) : null,
    p_address: address,
    p_ip: ip,
    p_user_agent: userAgent,
  });

  if (error) {
    return { error: friendlyRpcError(error.message) };
  }

  revalidatePath("/superadmin/dirigentes");
  revalidatePath(`/superadmin/dirigentes/${leaderId}`);
  return { error: null };
}

export async function removeLeaderAction(leaderId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { ip, userAgent } = await getRequestMeta();

  const { error } = await supabase.rpc("fn_remove_leader", {
    p_leader_id: leaderId,
    p_ip: ip,
    p_user_agent: userAgent,
  });

  if (error) {
    return { error: friendlyRpcError(error.message) };
  }

  revalidatePath("/superadmin/dirigentes");
  return { error: null };
}
