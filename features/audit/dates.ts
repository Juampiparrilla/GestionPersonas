export const AUDIT_TIME_ZONE = "America/Argentina/Buenos_Aires";

export type AuditRange = "today" | "week" | "all";

// Fecha (YYYY-MM-DD) en hora de Argentina, `daysAgo` dias atras.
export function argentinaDate(daysAgo = 0): string {
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return date.toLocaleDateString("en-CA", { timeZone: AUDIT_TIME_ZONE });
}

// "05/09": dia y mes con dos digitos (toLocaleDateString en es-AR devuelve
// "5/9", sin el cero).
export function formatDayMonth(iso: string): string {
  const parts = new Intl.DateTimeFormat("es-AR", {
    timeZone: AUDIT_TIME_ZONE,
    day: "numeric",
    month: "numeric",
  }).formatToParts(new Date(iso));
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}`;
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
    : formatDayMonth(iso);
}

// Filtro de fecha de cada rango de la pantalla de auditoria (Hoy · 7 días ·
// Todo). "Todo" no filtra por fecha.
export function rangeDates(range: AuditRange): { dateFrom?: string } {
  if (range === "today") return { dateFrom: argentinaDate(0) };
  if (range === "week") return { dateFrom: argentinaDate(6) };
  return {};
}
