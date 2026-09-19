import { ReportDownloadButtons } from "@/components/ReportDownloadButtons";
import { VehiclesClient } from "@/features/vehicles/VehiclesClient";
import { listMyVehicles } from "@/features/vehicles/queries";
import { getLeaderWriteStatus } from "@/lib/leader-write-status";
import { getSessionContext } from "@/lib/session";

export default async function VehiculosPage() {
  const session = await getSessionContext();
  const [vehicles, writeStatus] = await Promise.all([
    listMyVehicles(),
    getLeaderWriteStatus(session!.organizationId!, session!.leaderId!),
  ]);

  return (
    <VehiclesClient
      vehicles={vehicles}
      canWrite={writeStatus.canWrite}
      exportSlot={
        <ReportDownloadButtons
          pdfHref="/api/reportes/mis-vehiculos/pdf"
          showExcel={false}
          disabled={vehicles.length === 0}
          disabledMessage="Cargá al menos un vehículo para generar este reporte."
        />
      }
    />
  );
}
