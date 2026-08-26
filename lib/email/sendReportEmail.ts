import "server-only";

import { listActiveLeaders } from "@/features/leaders/queries";
import { listAllPeopleGroupedByLeader } from "@/features/people/queries";
import { listAllPointersGroupedByLeader } from "@/features/pointers/queries";
import { listAllVehiclesGroupedByLeader } from "@/features/vehicles/queries";
import { buildLeadersReportPdf } from "@/lib/reports/leadersReport";
import { buildPeopleReportPdf } from "@/lib/reports/peopleReport";
import { buildPointersReportPdf } from "@/lib/reports/pointersReport";
import { buildVehiclesReportPdf } from "@/lib/reports/vehiclesReport";

import { REPORT_TYPE_LABEL, type ReportType } from "./reportTypes";
import { getResendClient, REPORT_EMAIL_FROM } from "./resend";

export type { ReportType } from "./reportTypes";
export { parseReportTypes, REPORT_TYPE_LABEL } from "./reportTypes";

// Reutilizada tanto por "Enviar prueba" (features/reportSchedules/actions.ts)
// como por el cron diario (app/api/cron/daily/route.ts) -- mismo criterio
// que "Generar respaldo ahora" del diseno para backups: el envio manual y el
// automatico arman el email exactamente igual, no hay dos implementaciones
// que puedan desincronizarse.
//
// Esta funcion recibe los datos YA CARGADOS (en vez de consultarlos ella
// misma) porque el cron corre con service_role para TODAS las
// organizaciones sin sesion de usuario, mientras que "Enviar prueba" corre
// con la sesion del superadmin -- cada caller trae los datos con el cliente
// que le corresponde.
export async function sendOrganizationReportEmail({
  organizationName,
  recipientEmail,
  reportTypes,
  leaders,
  pointerGroups,
  peopleGroups,
  vehicleGroups,
}: {
  organizationName: string;
  recipientEmail: string;
  reportTypes: ReportType[];
  leaders: Awaited<ReturnType<typeof listActiveLeaders>>;
  pointerGroups: Awaited<ReturnType<typeof listAllPointersGroupedByLeader>>;
  peopleGroups: Awaited<ReturnType<typeof listAllPeopleGroupedByLeader>>;
  vehicleGroups: Awaited<ReturnType<typeof listAllVehiclesGroupedByLeader>>;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (reportTypes.length === 0) {
    return { ok: false, error: "Elegí al menos un reporte para enviar." };
  }

  const attachments: { filename: string; content: Buffer }[] = [];

  for (const type of reportTypes) {
    if (type === "dirigentes") {
      attachments.push({
        filename: "Dirigentes.pdf",
        content: await buildLeadersReportPdf(leaders, "combined", organizationName),
      });
    } else if (type === "punteros") {
      attachments.push({
        filename: "Punteros.pdf",
        content: await buildPointersReportPdf(pointerGroups, "combined", organizationName),
      });
    } else if (type === "personas") {
      attachments.push({
        filename: "Personas.pdf",
        content: await buildPeopleReportPdf(peopleGroups, "combined", organizationName),
      });
    } else if (type === "vehiculos") {
      attachments.push({
        filename: "Vehiculos.pdf",
        content: await buildVehiclesReportPdf(vehicleGroups, "combined", organizationName),
      });
    }
  }

  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from: REPORT_EMAIL_FROM,
    to: recipientEmail,
    subject: `Reportes de ${organizationName} - Gestión de Personas`,
    text:
      `Adjuntamos los reportes de ${organizationName}: ` +
      `${reportTypes.map((type) => REPORT_TYPE_LABEL[type]).join(", ")}.`,
    attachments: attachments.map((attachment) => ({
      filename: attachment.filename,
      content: attachment.content,
    })),
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
