import "server-only";

import { headers } from "next/headers";

import { buildSyntheticEmail } from "@/lib/synthetic-email";
import { createAdminClient } from "@/lib/supabase/admin";
import type { createClient } from "@/lib/supabase/server";
import { buildWhatsAppInviteLink } from "@/utils/whatsapp";

export type GrantAccessResult =
  | { ok: true; whatsappLink: string | null; shareMessage: string }
  | { ok: false; error: string };

// Crea la cuenta de acceso de un dirigente (si todavia no tenia una) o
// genera un link nuevo para reenviarle la invitacion (si ya tenia cuenta
// pero no la acepto, o para "olvide mi contraseña" asistido por el
// Superadmin). Si hay telefono cargado devuelve un link de WhatsApp directo
// a esa persona; wa.me REQUIERE un numero para funcionar, no existe un link
// que abra un selector de contacto generico, asi que sin telefono se
// devuelve el mensaje solo para copiar a mano. Nunca manda nada por si
// mismo, el Superadmin decide cuando y a quien enviarselo.
export async function grantLeaderAccess({
  supabase,
  leaderId,
  fullName,
  phone,
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
  phone: string | null;
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

  const type = existingProfileId ? "recovery" : "invite";

  // OJO: admin.generateLink() arma su `action_link` para el flujo "implicit"
  // (token en el FRAGMENTO de la URL), pero el cliente de este proyecto usa
  // "pkce" (asi viene fijo en @supabase/ssr, no se puede desactivar) y
  // RECHAZA esos links -- por eso nunca funcionaban, sin importar la URL de
  // redireccion. En vez de usar action_link, armamos nuestro propio link con
  // el `hashed_token` (properties.hashed_token) y lo verificamos nosotros
  // mismos del lado del servidor con supabase.auth.verifyOtp({ token_hash,
  // type }), que no depende de ningun flujo de redireccion.
  const { data: generated, error: generateError } = await admin.auth.admin.generateLink({
    type,
    email,
    options: { redirectTo: `${origin}/actualizar-contrasena` },
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

  const ownLink =
    `${origin}/auth/verify?token_hash=${generated.properties.hashed_token}&type=${type}` +
    `&next=/actualizar-contrasena`;

  const message =
    `Hola ${fullName}! Te sumamos a Gestión de Personas. Entrá a este link para crear tu ` +
    `contraseña: ${ownLink}\n\nDespués, para ingresar usá tu DNI ` +
    `(${dniForMessage}) y esa contraseña.`;

  return {
    ok: true,
    whatsappLink: phone ? buildWhatsAppInviteLink(phone, message) : null,
    shareMessage: message,
  };
}
