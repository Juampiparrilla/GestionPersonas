import { ReportDownloadButtons } from "@/components/ReportDownloadButtons";
import { TopbarActions } from "@/components/desktop/ShellContext";
import { AdminBottomNav } from "@/components/ui/RoleNav";
import { Screen } from "@/components/ui/Screen";
import { AllPeopleView } from "@/features/people/AllPeopleView";
import { listAllPeopleGroupedByLeader } from "@/features/people/queries";

export default async function SuperadminPersonasPage() {
  const groups = await listAllPeopleGroupedByLeader();
  const reportProps = {
    pdfHref: "/api/reportes/personas/pdf",
    excelHref: "/api/reportes/personas/excel",
    showPdfModes: true,
  };

  return (
    <Screen
      shell
      desktopContent
      title="Personas"
      headerRight={<ReportDownloadButtons variant="header" {...reportProps} />}
      bar={<AdminBottomNav />}
    >
      <TopbarActions>
        <ReportDownloadButtons variant="topbar" {...reportProps} />
      </TopbarActions>
      <AllPeopleView groups={groups} />
    </Screen>
  );
}
