import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { AllVehiclesView } from "@/features/vehicles/AllVehiclesView";
import { listAllVehiclesGroupedByLeader } from "@/features/vehicles/queries";

export default async function SuperadminVehiculosPage() {
  const groups = await listAllVehiclesGroupedByLeader();

  return (
    <div className="flex flex-1 flex-col gap-6 bg-zinc-50 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Vehículos</h1>
        <Link
          href="/superadmin/reportes"
          className="flex items-center gap-1 text-sm text-zinc-600 underline underline-offset-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver
        </Link>
      </div>

      <AllVehiclesView groups={groups} />
    </div>
  );
}
