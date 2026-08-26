import { NextResponse } from "next/server";

import { listActiveLeaders } from "@/features/leaders/queries";
import { getSessionContext } from "@/lib/session";
import { buildReportFilename, contentDispositionHeader } from "@/lib/reports/filename";
import { buildLeadersReportExcel } from "@/lib/reports/leadersReport";
import { getOrganizationName } from "@/lib/reports/organizationName";

export async function GET() {
  const session = await getSessionContext();
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const [leaders, organizationName] = await Promise.all([
    listActiveLeaders(),
    getOrganizationName(session.organizationId!),
  ]);
  const buffer = await buildLeadersReportExcel(leaders, organizationName);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": contentDispositionHeader(buildReportFilename(["Dirigentes"], "xlsx")),
    },
  });
}
