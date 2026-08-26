import { NextResponse } from "next/server";

import { listMyVehicles } from "@/features/vehicles/queries";
import type { VehicleLeaderGroup } from "@/features/vehicles/queries";
import { getSessionContext } from "@/lib/session";
import { buildReportFilename, contentDispositionHeader } from "@/lib/reports/filename";
import { getOrganizationName } from "@/lib/reports/organizationName";
import { buildVehiclesReportPdf } from "@/lib/reports/vehiclesReport";

export async function GET() {
  const session = await getSessionContext();
  if (!session || session.role !== "leader" || !session.leaderId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const [vehicles, organizationName] = await Promise.all([
    listMyVehicles(),
    getOrganizationName(session.organizationId!),
  ]);
  const groups: VehicleLeaderGroup[] = [
    { leaderId: session.leaderId, leaderName: `Dirigente: ${session.fullName}`, vehicles },
  ];
  const buffer = await buildVehiclesReportPdf(groups, "combined", organizationName);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": contentDispositionHeader(buildReportFilename([session.fullName, "Vehículos"], "pdf")),
    },
  });
}
