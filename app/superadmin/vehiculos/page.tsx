import { ReportDownloadButtons } from "@/components/ReportDownloadButtons";
import { ActionBar } from "@/components/ui/ActionBar";
import { Screen } from "@/components/ui/Screen";
import { AllVehiclesView } from "@/features/vehicles/AllVehiclesView";
import { listAllVehiclesGroupedByLeader } from "@/features/vehicles/queries";

export default async function SuperadminVehiculosPage() {
  const groups = await listAllVehiclesGroupedByLeader();

  return (
    <Screen
      title="Vehículos"
      backHref="/superadmin/reportes"
      bar={
        <ActionBar>
          <ReportDownloadButtons
            variant="wide"
            pdfHref="/api/reportes/vehiculos/pdf"
            excelHref="/api/reportes/vehiculos/excel"
            showPdfModes
          />
        </ActionBar>
      }
    >
      <AllVehiclesView groups={groups} />
    </Screen>
  );
}
