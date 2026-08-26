import { type NextRequest, NextResponse } from "next/server";

import { listAllPeopleGroupedByLeader } from "@/features/people/queries";
import { getSessionContext } from "@/lib/session";
import { buildReportFilename, contentDispositionHeader } from "@/lib/reports/filename";
import { getOrganizationName } from "@/lib/reports/organizationName";
import { parsePdfReportMode } from "@/lib/reports/pdfHelpers";
import { buildPeopleReportPdf } from "@/lib/reports/peopleReport";

export async function GET(request: NextRequest) {
  const session = await getSessionContext();
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const mode = parsePdfReportMode(request.nextUrl.searchParams.get("mode"));
  const [groups, organizationName] = await Promise.all([
    listAllPeopleGroupedByLeader(),
    getOrganizationName(session.organizationId!),
  ]);
  const buffer = await buildPeopleReportPdf(groups, mode, organizationName);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": contentDispositionHeader(buildReportFilename(["Personas"], "pdf")),
    },
  });
}
