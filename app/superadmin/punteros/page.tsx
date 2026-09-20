import { ReportDownloadButtons } from "@/components/ReportDownloadButtons";
import { TopbarActions } from "@/components/desktop/ShellContext";
import { AdminBottomNav } from "@/components/ui/RoleNav";
import { Screen } from "@/components/ui/Screen";
import { AllPointersView } from "@/features/pointers/AllPointersView";
import { listAllPointersGroupedByLeader } from "@/features/pointers/queries";

export default async function SuperadminPunterosPage() {
  const groups = await listAllPointersGroupedByLeader();
  const reportProps = {
    pdfHref: "/api/reportes/punteros/pdf",
    excelHref: "/api/reportes/punteros/excel",
    showPdfModes: true,
  };

  return (
    <Screen
      shell
      desktopContent
      title="Punteros"
      headerRight={<ReportDownloadButtons variant="header" {...reportProps} />}
      bar={<AdminBottomNav />}
    >
      <TopbarActions>
        <ReportDownloadButtons variant="topbar" {...reportProps} />
      </TopbarActions>
      <AllPointersView groups={groups} />
    </Screen>
  );
}
