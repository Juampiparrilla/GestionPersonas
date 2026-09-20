import { ReportDownloadButtons } from "@/components/ReportDownloadButtons";
import { TopbarActions } from "@/components/desktop/ShellContext";
import { AdminBottomNav } from "@/components/ui/RoleNav";
import { Screen } from "@/components/ui/Screen";
import { AllVehiclesView } from "@/features/vehicles/AllVehiclesView";
import { listAllVehiclesGroupedByLeader } from "@/features/vehicles/queries";

export default async function SuperadminVehiculosPage() {
  const groups = await listAllVehiclesGroupedByLeader();
  const reportProps = {
    pdfHref: "/api/reportes/vehiculos/pdf",
    excelHref: "/api/reportes/vehiculos/excel",
    showPdfModes: true,
  };

  return (
    <Screen
      shell
      desktopContent
      title="Vehículos"
      headerRight={<ReportDownloadButtons variant="header" {...reportProps} />}
      bar={<AdminBottomNav />}
    >
      <TopbarActions>
        <ReportDownloadButtons variant="topbar" {...reportProps} />
      </TopbarActions>
      <AllVehiclesView groups={groups} />
    </Screen>
  );
}
