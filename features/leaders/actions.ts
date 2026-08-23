"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { getRequestMeta } from "@/lib/request-meta";
import { getSessionContext } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { buildSyntheticEmail } from "@/lib/synthetic-email";
import type { LeaderAccessStatus } from "@/types/domain";
import { isValidDniFormat, normalizeDni } from "@/utils/dni";
import { friendlyRpcError } from "@/utils/rpc-errors";
import { buildWhatsAppInviteLink } from "@/utils/whatsapp";

export type CreateLeaderState = {
  error: string | null;
  success: boolean;
  whatsappLink?: string | null;
  accessLink?: string | null;
};

export async function createLeaderAction(
  _prevState: CreateLeaderState,
  formData: FormData
): Promise<CreateLeaderState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const dni = String(formData.get("dni") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const wantsAccess = formData.get("wantsAccess") === "on";

  if (!fullName || !dni) {
    return { error: "Completá el nombre y el DNI.", success: false };
  }
  if (!isValidDniFormat(dni)) {
    return { error: "El DNI no es válido.", success: false };
  }
  if (wantsAccess && !phone && !email) {
    return {
      error: "Para darle acceso, cargá el teléfono (para mandarlo por WhatsApp) o un correo.",
      success: false,
    };
  }

  // El cliente con service_role (mas abajo) bypassea RLS por completo, asi
  // que ESTE chequeo de rol es la unica barrera para esa parte: un Server
  // Action se puede invocar directo, no solo desde el formulario que lo
  // renderiza (ver node_modules/next/dist/docs/.../guides/forms.md).
  const session = await getSessionContext();
  if (!session || session.role !== "superadmin") {
    return { error: "No tenés permiso para hacer esto.", success: false };
  }

  const supabase = await createClient();
  const { ip, userAgent } = await getRequestMeta();

  // Si se pidio darle acceso, se crea la cuenta y se genera el link para que
  // la persona elija su propia contraseña -- pero NO se manda por el mail
  // automatico de Supabase: se devuelve el link para que el Superadmin lo
  // mande el mismo por WhatsApp (o lo copie a mano si solo hay correo real y
  // no telefono). Recien despues se crea/reasigna el dirigente en si via la
  // RPC, pasandole el id de esa cuenta para que quede linkeada.
  //
  // Si no se cargo un correo real, se usa uno interno generado a partir del
  // DNI: la persona nunca lo ve ni lo necesita, porque va a iniciar sesion
  // con su DNI (ver app/(auth)/login/actions.ts), no con este correo.
  let profileId: string | null = null;
  let createdAuthUserId: string | null = null;
  let accessLink: string | null = null;

  if (wantsAccess) {
    const admin = createAdminClient();
    const headersList = await headers();
    const origin = headersList.get("origin") ?? "";
    const loginEmail = email || buildSyntheticEmail(normalizeDni(dni), session.organizationId);

    const { data: generated, error: generateError } = await admin.auth.admin.generateLink({
      type: "invite",
      email: loginEmail,
      options: { redirectTo: `${origin}/auth/callback?next=/actualizar-contrasena` },
    });

    if (generateError || !generated.user) {
      if (generateError?.code === "email_exists" || generateError?.message.includes("already")) {
        return { error: "Ya existe una cuenta con ese correo.", success: false };
      }
      return { error: "No pudimos crear la cuenta de acceso. Probá de nuevo.", success: false };
    }

    createdAuthUserId = generated.user.id;
    accessLink = generated.properties.action_link;

    const { error: profileError } = await admin.from("profiles").insert({
      id: generated.user.id,
      organization_id: session.organizationId,
      full_name: fullName,
      role: "leader",
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(generated.user.id);
      return { error: "No pudimos crear la cuenta de acceso. Probá de nuevo.", success: false };
    }

    profileId = generated.user.id;
  }

  const { error } = await supabase.rpc("fn_create_leader", {
    p_dni: normalizeDni(dni),
    p_full_name: fullName,
    p_phone: phone || null,
    p_profile_id: profileId,
    p_ip: ip,
    p_user_agent: userAgent,
  });

  if (error) {
    // Si la RPC falla (ej. DNI_BLOCKED) no dejamos una cuenta de acceso
    // huerfana sin dirigente asociado.
    if (createdAuthUserId) {
      await createAdminClient().auth.admin.deleteUser(createdAuthUserId);
    }
    return { error: friendlyRpcError(error.message), success: false };
  }

  revalidatePath("/superadmin/dirigentes");

  const whatsappLink =
    accessLink && phone
      ? buildWhatsAppInviteLink(
          phone,
          `Hola ${fullName}! Te sumamos a Gestión de Personas. Entrá a este link para crear tu contraseña: ${accessLink}\n\nDespués, para ingresar usá tu DNI (${dni}) y esa contraseña.`
        )
      : null;

  return { error: null, success: true, accessLink, whatsappLink };
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
  phone: string | null
): Promise<ActionResult> {
  const supabase = await createClient();
  const { ip, userAgent } = await getRequestMeta();

  const { error } = await supabase.rpc("fn_update_leader", {
    p_leader_id: leaderId,
    p_full_name: fullName,
    p_phone: phone,
    p_ip: ip,
    p_user_agent: userAgent,
  });

  if (error) {
    return { error: friendlyRpcError(error.message) };
  }

  revalidatePath("/superadmin/dirigentes");
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
