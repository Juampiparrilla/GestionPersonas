import { NextResponse } from "next/server";

import { listAllVehiclesGroupedByLeader } from "@/features/vehicles/queries";
import { getSessionContext } from "@/lib/session";
import { buildVehiclesReportPdf } from "@/lib/reports/vehiclesReport";

export async function GET() {
  const session = await getSessionContext();
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const groups = await listAllVehiclesGroupedByLeader();
  const buffer = await buildVehiclesReportPdf(groups);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="vehiculos-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
