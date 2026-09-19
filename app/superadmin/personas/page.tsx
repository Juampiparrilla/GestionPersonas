import { ReportDownloadButtons } from "@/components/ReportDownloadButtons";
import { ActionBar } from "@/components/ui/ActionBar";
import { Screen } from "@/components/ui/Screen";
import { AllPeopleView } from "@/features/people/AllPeopleView";
import { listAllPeopleGroupedByLeader } from "@/features/people/queries";

export default async function SuperadminPersonasPage() {
  const groups = await listAllPeopleGroupedByLeader();

  return (
    <Screen
      title="Personas registradas"
      backHref="/superadmin/reportes"
      bar={
        <ActionBar>
          <ReportDownloadButtons
            variant="wide"
            pdfHref="/api/reportes/personas/pdf"
            excelHref="/api/reportes/personas/excel"
            showPdfModes
          />
        </ActionBar>
      }
    >
      <AllPeopleView groups={groups} />
    </Screen>
  );
}
