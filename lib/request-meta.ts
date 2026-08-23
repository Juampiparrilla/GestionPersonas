import { headers } from "next/headers";

// Metadatos de la request para pasarle a las funciones RPC de auditoria
// (p_ip / p_user_agent en supabase/migrations/0001_init.sql).
export async function getRequestMeta() {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");

  return {
    ip: forwardedFor ? forwardedFor.split(",")[0].trim() : null,
    userAgent: headersList.get("user-agent"),
  };
}
