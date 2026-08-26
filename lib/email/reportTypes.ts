// Separado de sendReportEmail.ts a proposito: ese archivo importa
// lib/email/resend.ts, que tiene `import "server-only"` -- si
// ReportEmailScheduleForm.tsx (Client Component) importara REPORT_TYPE_LABEL
// desde ahi, arrastraria ese "server-only" al bundle del cliente y rompe el
// build. Este archivo no depende de nada server-only, se puede importar
// tanto desde server como desde client.
export type ReportType = "dirigentes" | "punteros" | "personas" | "vehiculos";

export const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  dirigentes: "Dirigentes",
  punteros: "Punteros",
  personas: "Personas registradas",
  vehiculos: "Vehículos",
};

function isReportType(value: string): value is ReportType {
  return value in REPORT_TYPE_LABEL;
}

export function parseReportTypes(values: string[]): ReportType[] {
  return values.filter(isReportType);
}
