import { ReportDownloadButtons } from "@/components/ReportDownloadButtons";
import { AdminBottomNav } from "@/components/ui/RoleNav";
import { Screen } from "@/components/ui/Screen";
import { AllVehiclesView } from "@/features/vehicles/AllVehiclesView";
import { listAllVehiclesGroupedByLeader } from "@/features/vehicles/queries";

export default async function SuperadminVehiculosPage() {
  const groups = await listAllVehiclesGroupedByLeader();

  return (
    <Screen
      title="Vehículos"
      headerRight={
        <ReportDownloadButtons
          variant="header"
          pdfHref="/api/reportes/vehiculos/pdf"
          excelHref="/api/reportes/vehiculos/excel"
          showPdfModes
        />
      }
      bar={<AdminBottomNav />}
    >
      <AllVehiclesView groups={groups} />
    </Screen>
  );
}
