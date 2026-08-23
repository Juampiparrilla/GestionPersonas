import "server-only";

import { headers } from "next/headers";

import { buildSyntheticEmail } from "@/lib/synthetic-email";
import { createAdminClient } from "@/lib/supabase/admin";
import type { createClient } from "@/lib/supabase/server";
import { buildWhatsAppShareLink } from "@/utils/whatsapp";

export type GrantAccessResult =
  | { ok: true; whatsappLink: string }
  | { ok: false; error: string };

// Crea la cuenta de acceso de un dirigente (si todavia no tenia una) o
// genera un link nuevo para reenviarle la invitacion (si ya tenia cuenta
// pero no la acepto, o para "olvide mi contraseña" asistido por el
// Superadmin). Devuelve un link de WhatsApp listo para compartir -- nunca
// manda nada por si mismo, el Superadmin decide a quien enviarselo.
export async function grantLeaderAccess({
  supabase,
  leaderId,
  fullName,
  dniNormalized,
  dniForMessage,
  organizationId,
  existingProfileId,
  ip,
  userAgent,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  leaderId: string;
  fullName: string;
  dniNormalized: string;
  dniForMessage: string;
  organizationId: string;
  existingProfileId: string | null;
  ip: string | null;
  userAgent: string | null;
}): Promise<GrantAccessResult> {
  const admin = createAdminClient();
  const headersList = await headers();
  const origin = headersList.get("origin") ?? "";
  const redirectTo = `${origin}/auth/callback?next=/actualizar-contrasena`;

  let email: string;
  if (existingProfileId) {
    const { data: userResult } = await admin.auth.admin.getUserById(existingProfileId);
    if (!userResult.user?.email) {
      return { ok: false, error: "No pudimos generar el link. Probá de nuevo." };
    }
    email = userResult.user.email;
  } else {
    email = buildSyntheticEmail(dniNormalized, organizationId);
  }

  const { data: generated, error: generateError } = await admin.auth.admin.generateLink({
    type: existingProfileId ? "recovery" : "invite",
    email,
    options: { redirectTo },
  });

  if (generateError || !generated.user) {
    return { ok: false, error: "No pudimos generar el link. Probá de nuevo." };
  }

  if (!existingProfileId) {
    const { error: profileError } = await admin.from("profiles").insert({
      id: generated.user.id,
      organization_id: organizationId,
      full_name: fullName,
      role: "leader",
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(generated.user.id);
      return { ok: false, error: "No pudimos crear la cuenta de acceso. Probá de nuevo." };
    }

    // Vincular via RPC (no con un update directo) para que quede auditado
    // igual que cualquier otra escritura de negocio.
    const { error: linkError } = await supabase.rpc("fn_link_leader_profile", {
      p_leader_id: leaderId,
      p_profile_id: generated.user.id,
      p_ip: ip,
      p_user_agent: userAgent,
    });

    if (linkError) {
      await admin.auth.admin.deleteUser(generated.user.id);
      return { ok: false, error: "No pudimos vincular la cuenta de acceso. Probá de nuevo." };
    }
  }

  const message =
    `Hola ${fullName}! Te sumamos a Gestión de Personas. Entrá a este link para crear tu ` +
    `contraseña: ${generated.properties.action_link}\n\nDespués, para ingresar usá tu DNI ` +
    `(${dniForMessage}) y esa contraseña.`;

  return { ok: true, whatsappLink: buildWhatsAppShareLink(message) };
}
