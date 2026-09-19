import { ReportDownloadButtons } from "@/components/ReportDownloadButtons";
import { AdminBottomNav } from "@/components/ui/RoleNav";
import { Screen } from "@/components/ui/Screen";
import { AllPointersView } from "@/features/pointers/AllPointersView";
import { listAllPointersGroupedByLeader } from "@/features/pointers/queries";

export default async function SuperadminPunterosPage() {
  const groups = await listAllPointersGroupedByLeader();

  return (
    <Screen
      title="Punteros"
      headerRight={
        <ReportDownloadButtons
          variant="header"
          pdfHref="/api/reportes/punteros/pdf"
          excelHref="/api/reportes/punteros/excel"
          showPdfModes
        />
      }
      bar={<AdminBottomNav />}
    >
      <AllPointersView groups={groups} />
    </Screen>
  );
}
