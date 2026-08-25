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

// Igual concepto que grantLeaderAccess de arriba, pero para el
// Administrador de una Organización (multitenant, 0014): a diferencia de
// un dirigente, el admin de organización NO tiene fila en `individuals`
// (no forma parte de la jerarquía dirigente→puntero→persona, no tiene
// DNI que resolver en el login), así que necesita un email REAL desde el
// principio -- no se le puede armar uno sintético por DNI -- y no hay
// `leaders` al que vincular vía fn_link_leader_profile. Se mantiene como
// función separada (no una rama más dentro de grantLeaderAccess) para no
// tocar ese flujo, que ya funciona y está probado.
export async function grantOrgAdminAccess({
  organizationId,
  fullName,
  phone,
  email,
  existingProfileId,
}: {
  organizationId: string;
  fullName: string;
  phone: string | null;
  // Requerido al crear (no hay de donde sacarlo). Al reenviar
  // (existingProfileId presente) se puede omitir: se resuelve solo,
  // leyendo el email ya cargado en auth.users -- igual criterio que
  // grantLeaderAccess.
  email?: string;
  existingProfileId: string | null;
}): Promise<GrantAccessResult> {
  const admin = createAdminClient();
  const headersList = await headers();
  const origin = headersList.get("origin") ?? "";

  let resolvedEmail = email ?? null;
  if (existingProfileId) {
    const { data: userResult } = await admin.auth.admin.getUserById(existingProfileId);
    if (!userResult.user?.email) {
      return { ok: false, error: "No pudimos generar el link. Probá de nuevo." };
    }
    resolvedEmail = userResult.user.email;
  }
  if (!resolvedEmail) {
    return { ok: false, error: "Falta el correo del administrador." };
  }
  const emailToUse = resolvedEmail;

  const type = existingProfileId ? "recovery" : "invite";

  const { data: generated, error: generateError } = await admin.auth.admin.generateLink({
    type,
    email: emailToUse,
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
      role: "superadmin",
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(generated.user.id);
      return { ok: false, error: "No pudimos crear la cuenta de acceso. Probá de nuevo." };
    }
  }

  const ownLink =
    `${origin}/auth/verify?token_hash=${generated.properties.hashed_token}&type=${type}` +
    `&next=/actualizar-contrasena`;

  const message =
    `Hola ${fullName}! Te sumamos como administrador de tu organización en Gestión de ` +
    `Personas. Entrá a este link para crear tu contraseña: ${ownLink}\n\nDespués, para ` +
    `ingresar usá tu correo (${emailToUse}) y esa contraseña.`;

  return {
    ok: true,
    whatsappLink: phone ? buildWhatsAppInviteLink(phone, message) : null,
    shareMessage: message,
  };
}
