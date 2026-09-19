export const AUDIT_TIME_ZONE = "America/Argentina/Buenos_Aires";

export type AuditRange = "today" | "week" | "all";

// Fecha (YYYY-MM-DD) en hora de Argentina, `daysAgo` dias atras.
export function argentinaDate(daysAgo = 0): string {
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return date.toLocaleDateString("en-CA", { timeZone: AUDIT_TIME_ZONE });
}

// Filtro de fecha de cada rango de la pantalla de auditoria (Hoy · 7 días ·
// Todo). "Todo" no filtra por fecha.
export function rangeDates(range: AuditRange): { dateFrom?: string } {
  if (range === "today") return { dateFrom: argentinaDate(0) };
  if (range === "week") return { dateFrom: argentinaDate(6) };
  return {};
}
