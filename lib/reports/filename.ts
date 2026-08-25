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
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const timePart = `${pad(now.getHours())}-${pad(now.getMinutes())}`;
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
