"use server";

import { revalidatePath } from "next/cache";

import { grantOrgAdminAccess } from "@/lib/leader-access";
import { getRequestMeta } from "@/lib/request-meta";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { isValidDniFormat, normalizeDni } from "@/utils/dni";
import { friendlyRpcError } from "@/utils/rpc-errors";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CreateOrganizationState = { error: string | null; success: boolean };

export async function createOrganizationAction(
  _prevState: CreateOrganizationState,
  formData: FormData
): Promise<CreateOrganizationState> {
  const orgName = String(formData.get("orgName") ?? "").trim();
  const adminFullName = String(formData.get("adminFullName") ?? "").trim();
  const adminDni = String(formData.get("adminDni") ?? "").trim();
  const adminEmail = String(formData.get("adminEmail") ?? "").trim();
  const adminPhone = String(formData.get("adminPhone") ?? "").trim();

  if (!orgName || !adminFullName || !adminDni) {
    return {
      error: "Completá el nombre de la organización, y el nombre y DNI del administrador.",
      success: false,
    };
  }
  if (!isValidDniFormat(adminDni)) {
    return { error: "El DNI del administrador no es válido.", success: false };
  }
  if (adminEmail && !EMAIL_PATTERN.test(adminEmail)) {
    return { error: "El correo del administrador no es válido.", success: false };
  }

  const session = await getSessionContext();
  if (!session || session.role !== "platform_admin") {
    return { error: "No tenés permiso para hacer esto.", success: false };
  }

  const supabase = await createClient();
  const { ip, userAgent } = await getRequestMeta();

  const { data: organizationId, error } = await supabase.rpc("fn_create_organization", {
    p_org_name: orgName,
    p_ip: ip,
    p_user_agent: userAgent,
  });

  if (error) {
    return { error: friendlyRpcError(error.message), success: false };
  }

  revalidatePath("/plataforma");

  // La organización ya quedó creada; el acceso del administrador se genera
  // siempre en silencio (mismo criterio que createLeaderAction para
  // dirigentes): si esto falla, la organización igual queda creada y se
  // puede reintentar después desde la lista ("crear/recrear administrador").
  await grantOrgAdminAccess({
    organizationId: organizationId as string,
    fullName: adminFullName,
    phone: adminPhone || null,
    email: adminEmail || null,
    dniNormalized: normalizeDni(adminDni),
    dniForMessage: adminDni,
    existingProfileId: null,
  });

  return { error: null, success: true };
}

export type OrgInviteResult =
  | { ok: false; error: string }
  | { ok: true; whatsappLink: string | null; shareMessage: string };

// Cubre tanto "crear/recrear administrador" (la organización quedó sin
// admin porque grantOrgAdminAccess falló al crearla) como "reenviar
// invitación" (ya tiene admin, pero no aceptó todavía o perdió el link).
export async function grantOrCreateOrgAdminAction(
  organizationId: string,
  adminFullName: string,
  adminDni: string,
  adminEmail: string,
  adminPhone: string | null
): Promise<OrgInviteResult> {
  const session = await getSessionContext();
  if (!session || session.role !== "platform_admin") {
    return { ok: false, error: "No tenés permiso para hacer esto." };
  }

  const supabase = await createClient();

  const { data: existingAdmin } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("organization_id", organizationId)
    .eq("role", "superadmin")
    .maybeSingle();

  if (!existingAdmin && (!adminFullName.trim() || !adminDni.trim())) {
    return { ok: false, error: "Completá el nombre y el DNI del administrador." };
  }
  if (!existingAdmin && !isValidDniFormat(adminDni)) {
    return { ok: false, error: "El DNI del administrador no es válido." };
  }
  if (!existingAdmin && adminEmail && !EMAIL_PATTERN.test(adminEmail)) {
    return { ok: false, error: "El correo del administrador no es válido." };
  }

  const access = await grantOrgAdminAccess({
    organizationId,
    // Al reenviar (existingAdmin presente), el boton no pide estos datos
    // de nuevo -- se usa el nombre ya guardado, no lo que haya quedado en
    // el estado del formulario (que ni se muestra en ese caso).
    fullName: existingAdmin ? existingAdmin.full_name : adminFullName,
    phone: adminPhone,
    email: adminEmail || null,
    dniNormalized: existingAdmin ? undefined : normalizeDni(adminDni),
    dniForMessage: existingAdmin ? undefined : adminDni,
    existingProfileId: existingAdmin?.id ?? null,
  });

  if (!access.ok) {
    return access;
  }

  revalidatePath("/plataforma");
  return access;
}

export type ActionResult = { error: string | null };

export async function setOrganizationActiveAction(
  organizationId: string,
  isActive: boolean
): Promise<ActionResult> {
  const supabase = await createClient();
  const { ip, userAgent } = await getRequestMeta();

  const { error } = await supabase.rpc("fn_set_organization_active", {
    p_organization_id: organizationId,
    p_is_active: isActive,
    p_ip: ip,
    p_user_agent: userAgent,
  });

  if (error) {
    return { error: friendlyRpcError(error.message) };
  }

  revalidatePath("/plataforma");
  return { error: null };
}
