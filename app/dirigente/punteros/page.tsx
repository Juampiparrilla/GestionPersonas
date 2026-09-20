import { ReportDownloadButtons } from "@/components/ReportDownloadButtons";
import { PointersClient } from "@/features/pointers/PointersClient";
import { listMyPointers } from "@/features/pointers/queries";
import { getLeaderWriteStatus } from "@/lib/leader-write-status";
import { getSessionContext } from "@/lib/session";

export default async function PunterosPage() {
  const session = await getSessionContext();
  const [pointers, writeStatus] = await Promise.all([
    listMyPointers(),
    getLeaderWriteStatus(session!.organizationId!, session!.leaderId!),
  ]);

  return (
    <PointersClient
      pointers={pointers}
      canWrite={writeStatus.canWrite}
      exportDesktopSlot={
        <ReportDownloadButtons
          variant="topbar"
          pdfHref="/api/reportes/mis-punteros/pdf"
          showExcel={false}
          primaryLabel="Punteros"
          disabled={pointers.length === 0}
          disabledMessage="Cargá al menos un puntero para generar este reporte."
          secondary={{
            label: "Personas registradas",
            pdfHref: "/api/reportes/mis-personas/pdf",
            disabled: pointers.every((pointer) => pointer.peopleCount === 0),
            disabledMessage: "Todavía no hay personas registradas para generar este reporte.",
          }}
        />
      }
      exportSlot={
        <ReportDownloadButtons
          pdfHref="/api/reportes/mis-punteros/pdf"
          showExcel={false}
          primaryLabel="Punteros"
          disabled={pointers.length === 0}
          disabledMessage="Cargá al menos un puntero para generar este reporte."
          secondary={{
            label: "Personas registradas",
            pdfHref: "/api/reportes/mis-personas/pdf",
            disabled: pointers.every((pointer) => pointer.peopleCount === 0),
            disabledMessage: "Todavía no hay personas registradas para generar este reporte.",
          }}
        />
      }
    />
  );
}
