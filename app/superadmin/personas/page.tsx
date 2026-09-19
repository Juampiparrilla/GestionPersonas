import { ReportDownloadButtons } from "@/components/ReportDownloadButtons";
import { AdminBottomNav } from "@/components/ui/RoleNav";
import { Screen } from "@/components/ui/Screen";
import { AllPeopleView } from "@/features/people/AllPeopleView";
import { listAllPeopleGroupedByLeader } from "@/features/people/queries";

export default async function SuperadminPersonasPage() {
  const groups = await listAllPeopleGroupedByLeader();

  return (
    <Screen
      title="Personas"
      headerRight={
        <ReportDownloadButtons
          variant="header"
          pdfHref="/api/reportes/personas/pdf"
          excelHref="/api/reportes/personas/excel"
          showPdfModes
        />
      }
      bar={<AdminBottomNav />}
    >
      <AllPeopleView groups={groups} />
    </Screen>
  );
}
