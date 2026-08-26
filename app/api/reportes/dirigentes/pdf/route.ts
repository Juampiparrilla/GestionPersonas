import { type NextRequest, NextResponse } from "next/server";

import { listActiveLeaders } from "@/features/leaders/queries";
import { getSessionContext } from "@/lib/session";
import { buildReportFilename, contentDispositionHeader } from "@/lib/reports/filename";
import { buildLeadersReportPdf } from "@/lib/reports/leadersReport";
import { getOrganizationName } from "@/lib/reports/organizationName";
import { parsePdfReportMode } from "@/lib/reports/pdfHelpers";

export async function GET(request: NextRequest) {
  const session = await getSessionContext();
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const mode = parsePdfReportMode(request.nextUrl.searchParams.get("mode"));
  const [leaders, organizationName] = await Promise.all([
    listActiveLeaders(),
    getOrganizationName(session.organizationId!),
  ]);
  const buffer = await buildLeadersReportPdf(leaders, mode, organizationName);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": contentDispositionHeader(buildReportFilename(["Dirigentes"], "pdf")),
    },
  });
}
