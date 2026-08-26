import { type NextRequest, NextResponse } from "next/server";

import { listAllPointersGroupedByLeader } from "@/features/pointers/queries";
import { getSessionContext } from "@/lib/session";
import { buildReportFilename, contentDispositionHeader } from "@/lib/reports/filename";
import { getOrganizationName } from "@/lib/reports/organizationName";
import { parsePdfReportMode } from "@/lib/reports/pdfHelpers";
import { buildPointersReportPdf } from "@/lib/reports/pointersReport";

export async function GET(request: NextRequest) {
  const session = await getSessionContext();
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const mode = parsePdfReportMode(request.nextUrl.searchParams.get("mode"));
  const [groups, organizationName] = await Promise.all([
    listAllPointersGroupedByLeader(),
    getOrganizationName(session.organizationId!),
  ]);
  const buffer = await buildPointersReportPdf(groups, mode, organizationName);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": contentDispositionHeader(buildReportFilename(["Punteros"], "pdf")),
    },
  });
}
