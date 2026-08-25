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
      // Los dirigentes resuelven el login por individuals/leaders, no por
      // esta columna (0015, especifica de administradores).
      dni_normalized: null,
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
// Administrador de una Organización (multitenant, 0014/0015): a diferencia
// de un dirigente, el admin de organización NO tiene fila en `individuals`
// (no forma parte de la jerarquía dirigente→puntero→persona) -- su DNI se
// guarda directo en `profiles.dni_normalized` (único globalmente, ver
// 0015) en vez de en esa tabla, y no hay `leaders` al que vincular vía
// fn_link_leader_profile. El correo es opcional: si no se carga uno real,
// se arma uno sintético (mismo mecanismo que ya usan los dirigentes) para
// que la cuenta de Supabase Auth igual tenga un email único interno --
// nunca se le muestra a la persona, entra con su DNI. Se mantiene como
// función separada (no una rama más dentro de grantLeaderAccess) para no
// tocar ese flujo, que ya funciona y está probado.
export async function grantOrgAdminAccess({
  organizationId,
  fullName,
  phone,
  email,
  dniNormalized,
  dniForMessage,
  existingProfileId,
}: {
  organizationId: string;
  fullName: string;
  phone: string | null;
  // Opcional al crear (se arma uno sintético si falta). Al reenviar
  // (existingProfileId presente) se ignora: se resuelve solo, leyendo el
  // email ya cargado en auth.users -- igual criterio que grantLeaderAccess.
  email?: string | null;
  // Requerido al crear. Al reenviar se ignora: se lee el que ya quedó
  // guardado en profiles.dni_normalized.
  dniNormalized?: string;
  dniForMessage?: string;
  existingProfileId: string | null;
}): Promise<GrantAccessResult> {
  const admin = createAdminClient();
  const headersList = await headers();
  const origin = headersList.get("origin") ?? "";

  let resolvedEmail: string | null = null;
  let resolvedDniForMessage = dniForMessage ?? null;

  if (existingProfileId) {
    const [{ data: userResult }, { data: existingProfile }] = await Promise.all([
      admin.auth.admin.getUserById(existingProfileId),
      admin.from("profiles").select("dni_normalized").eq("id", existingProfileId).maybeSingle(),
    ]);
    if (!userResult.user?.email) {
      return { ok: false, error: "No pudimos generar el link. Probá de nuevo." };
    }
    resolvedEmail = userResult.user.email;
    resolvedDniForMessage = existingProfile?.dni_normalized ?? null;
  } else {
    if (!dniNormalized) {
      return { ok: false, error: "Falta el DNI del administrador." };
    }
    resolvedEmail = email && email.trim() ? email.trim() : buildSyntheticEmail(dniNormalized, organizationId);
  }

  if (!resolvedEmail) {
    return { ok: false, error: "No pudimos generar el link. Probá de nuevo." };
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
      dni_normalized: dniNormalized ?? null,
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
    `ingresar usá tu DNI (${resolvedDniForMessage ?? ""}) y esa contraseña.`;

  return {
    ok: true,
    whatsappLink: phone ? buildWhatsAppInviteLink(phone, message) : null,
    shareMessage: message,
  };
}
