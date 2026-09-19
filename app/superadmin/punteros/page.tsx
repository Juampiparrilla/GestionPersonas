import { ReportDownloadButtons } from "@/components/ReportDownloadButtons";
import { ActionBar } from "@/components/ui/ActionBar";
import { Screen } from "@/components/ui/Screen";
import { AllPointersView } from "@/features/pointers/AllPointersView";
import { listAllPointersGroupedByLeader } from "@/features/pointers/queries";

export default async function SuperadminPunterosPage() {
  const groups = await listAllPointersGroupedByLeader();

  return (
    <Screen
      title="Punteros"
      backHref="/superadmin/reportes"
      bar={
        <ActionBar>
          <ReportDownloadButtons
            variant="wide"
            pdfHref="/api/reportes/punteros/pdf"
            excelHref="/api/reportes/punteros/excel"
            showPdfModes
          />
        </ActionBar>
      }
    >
      <AllPointersView groups={groups} />
    </Screen>
  );
}
