export const AUDIT_TIME_ZONE = "America/Argentina/Buenos_Aires";

export type AuditRange = "today" | "week" | "all";

// Fecha (YYYY-MM-DD) en hora de Argentina, `daysAgo` dias atras.
export function argentinaDate(daysAgo = 0): string {
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return date.toLocaleDateString("en-CA", { timeZone: AUDIT_TIME_ZONE });
}

// Hora (HH:mm) si es de hoy, o dia/mes si es de otro dia -- para las listas
// de "ultima actividad".
export function formatActivityTime(iso: string): string {
  const date = new Date(iso);
  const sameDay =
    date.toLocaleDateString("es-AR", { timeZone: AUDIT_TIME_ZONE }) ===
    new Date().toLocaleDateString("es-AR", { timeZone: AUDIT_TIME_ZONE });

  return sameDay
    ? date.toLocaleTimeString("es-AR", {
        timeZone: AUDIT_TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : date.toLocaleDateString("es-AR", {
        timeZone: AUDIT_TIME_ZONE,
        day: "2-digit",
        month: "2-digit",
      });
}

// Filtro de fecha de cada rango de la pantalla de auditoria (Hoy · 7 días ·
// Todo). "Todo" no filtra por fecha.
export function rangeDates(range: AuditRange): { dateFrom?: string } {
  if (range === "today") return { dateFrom: argentinaDate(0) };
  if (range === "week") return { dateFrom: argentinaDate(6) };
  return {};
}
