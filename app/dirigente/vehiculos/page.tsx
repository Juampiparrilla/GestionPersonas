import Link from "next/link";

import { VehiclesClient } from "@/features/vehicles/VehiclesClient";
import { listMyVehicles } from "@/features/vehicles/queries";
import { getLeaderWriteStatus } from "@/lib/leader-write-status";
import { getSessionContext } from "@/lib/session";

export default async function VehiculosPage() {
  const session = await getSessionContext();
  const [vehicles, writeStatus] = await Promise.all([
    listMyVehicles(),
    getLeaderWriteStatus(session!.organizationId, session!.leaderId!),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 bg-zinc-50 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Mis Vehículos</h1>
        <Link href="/dirigente" className="text-sm text-zinc-600 underline underline-offset-2">
          Volver
        </Link>
      </div>

      <VehiclesClient vehicles={vehicles} canWrite={writeStatus.canWrite} />
    </div>
  );
}
