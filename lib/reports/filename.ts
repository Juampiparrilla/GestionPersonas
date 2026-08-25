// El servidor puede correr en UTC (Vercel, la mayoria de los hosts), pero
// el reporte tiene que mostrar la hora real del usuario en Argentina, no la
// del servidor -- se fuerza esta zona horaria en vez de usar Date.now() tal
// cual.
export const REPORT_TIME_ZONE = "America/Argentina/Buenos_Aires";

function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function sanitizeFilenamePart(part: string): string {
  return part
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "_");
}

// Arma el nombre del archivo a partir de sus "partes" (ej. ["Punteros"] o
// [nombreDirigente, nombrePuntero]) + fecha y hora del momento de
// generacion, ej. "PRUEBA_UNO_LUCIANO_PRUEBA_2026-08-25_14-30.pdf".
export function buildReportFilename(parts: string[], extension: "pdf" | "xlsx"): string {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) => dateParts.find((part) => part.type === type)?.value ?? "00";
  const datePart = `${get("year")}-${get("month")}-${get("day")}`;
  // Algunos motores ICU devuelven "24" en vez de "00" para la medianoche
  // con hour12:false.
  const hour = get("hour") === "24" ? "00" : get("hour");
  const timePart = `${hour}-${get("minute")}`;
  const namePart = [...parts.map(sanitizeFilenamePart), datePart, timePart].join("_");
  return `${namePart}.${extension}`;
}

// El header Content-Disposition solo garantiza soportar Latin-1 en el
// parametro `filename` simple, asi que se manda ademas `filename*=UTF-8''`
// (RFC 6266) para que tildes/ñ se vean bien en navegadores modernos, con
// una version sin acentos como respaldo para los que no lo soporten.
export function contentDispositionHeader(filename: string): string {
  const asciiFallback = stripDiacritics(filename).replace(/[^\x20-\x7E]/g, "_");
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
