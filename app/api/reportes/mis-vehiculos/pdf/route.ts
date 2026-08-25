import { NextResponse } from "next/server";

import { listMyVehicles } from "@/features/vehicles/queries";
import type { VehicleLeaderGroup } from "@/features/vehicles/queries";
import { getSessionContext } from "@/lib/session";
import { buildVehiclesReportPdf } from "@/lib/reports/vehiclesReport";

export async function GET() {
  const session = await getSessionContext();
  if (!session || session.role !== "leader" || !session.leaderId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const vehicles = await listMyVehicles();
  const groups: VehicleLeaderGroup[] = [
    { leaderId: session.leaderId, leaderName: `Dirigente: ${session.fullName}`, vehicles },
  ];
  const buffer = await buildVehiclesReportPdf(groups);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="mis-vehiculos-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
