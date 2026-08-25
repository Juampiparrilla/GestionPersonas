import { type NextRequest, NextResponse } from "next/server";

import { listAllVehiclesGroupedByLeader } from "@/features/vehicles/queries";
import { getSessionContext } from "@/lib/session";
import { buildReportFilename, contentDispositionHeader } from "@/lib/reports/filename";
import { parsePdfReportMode } from "@/lib/reports/pdfHelpers";
import { buildVehiclesReportPdf } from "@/lib/reports/vehiclesReport";

export async function GET(request: NextRequest) {
  const session = await getSessionContext();
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const mode = parsePdfReportMode(request.nextUrl.searchParams.get("mode"));
  const groups = await listAllVehiclesGroupedByLeader();
  const buffer = await buildVehiclesReportPdf(groups, mode);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": contentDispositionHeader(buildReportFilename(["Vehículos"], "pdf")),
    },
  });
}
