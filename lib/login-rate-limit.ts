import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

// Limite de intentos fallidos de login (tabla login_attempts, migracion 0021).
// Se cuenta por identificador (frena a quien prueba claves contra UNA cuenta)
// y por IP (frena a quien prueba muchas cuentas desde un mismo lugar).
const WINDOW_MINUTES = 15;
const MAX_FAILURES_PER_IDENTIFIER = 5;
const MAX_FAILURES_PER_IP = 20;

export const RATE_LIMIT_MESSAGE =
  "Demasiados intentos fallidos. Esperá unos 15 minutos antes de volver a probar.";

function windowStart(): string {
  return new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
}

// Si la tabla todavia no existe (migracion sin aplicar) o la consulta falla,
// NO se bloquea el login: un error de esta defensa no puede dejar a todos
// afuera. Se deja constancia en el log del servidor.
export async function isLoginRateLimited(identifier: string, ip: string | null): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const since = windowStart();

    const byIdentifier = await admin
      .from("login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("identifier", identifier)
      .gte("created_at", since);
    if (byIdentifier.error) throw byIdentifier.error;
    if ((byIdentifier.count ?? 0) >= MAX_FAILURES_PER_IDENTIFIER) return true;

    if (ip) {
      const byIp = await admin
        .from("login_attempts")
        .select("id", { count: "exact", head: true })
        .eq("ip", ip)
        .gte("created_at", since);
      if (byIp.error) throw byIp.error;
      if ((byIp.count ?? 0) >= MAX_FAILURES_PER_IP) return true;
    }
    return false;
  } catch (error) {
    console.error("[login-rate-limit] no se pudo consultar el limite:", error);
    return false;
  }
}

export async function recordLoginFailure(identifier: string, ip: string | null): Promise<void> {
  try {
    await createAdminClient().from("login_attempts").insert({ identifier, ip });
  } catch (error) {
    console.error("[login-rate-limit] no se pudo registrar el intento:", error);
  }
}

export async function clearLoginFailures(identifier: string): Promise<void> {
  try {
    await createAdminClient().from("login_attempts").delete().eq("identifier", identifier);
  } catch (error) {
    console.error("[login-rate-limit] no se pudo limpiar los intentos:", error);
  }
}

// Borra los intentos viejos (lo llama el cron diario).
export async function purgeOldLoginAttempts(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await createAdminClient().from("login_attempts").delete().lt("created_at", cutoff);
  } catch (error) {
    console.error("[login-rate-limit] no se pudo purgar:", error);
  }
}
