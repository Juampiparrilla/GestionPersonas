import { ReportDownloadButtons } from "@/components/ReportDownloadButtons";
import { DirigentesClient } from "@/features/leaders/DirigentesClient";
import { listActiveLeaders } from "@/features/leaders/queries";

export default async function DirigentesPage() {
  const leaders = await listActiveLeaders();

  return (
    <DirigentesClient
      leaders={leaders}
      exportSlot={
        <ReportDownloadButtons
          variant="header"
          pdfHref="/api/reportes/dirigentes/pdf"
          excelHref="/api/reportes/dirigentes/excel"
          showPdfModes
        />
      }
    />
  );
}
