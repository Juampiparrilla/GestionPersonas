import { NextResponse } from "next/server";

import { listAllPeopleGroupedByLeader } from "@/features/people/queries";
import { getSessionContext } from "@/lib/session";
import { buildReportFilename, contentDispositionHeader } from "@/lib/reports/filename";
import { getOrganizationName } from "@/lib/reports/organizationName";
import { buildPeopleReportExcel } from "@/lib/reports/peopleReport";

export async function GET() {
  const session = await getSessionContext();
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const [groups, organizationName] = await Promise.all([
    listAllPeopleGroupedByLeader(),
    getOrganizationName(session.organizationId!),
  ]);
  const buffer = await buildPeopleReportExcel(groups, organizationName);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": contentDispositionHeader(buildReportFilename(["Personas"], "xlsx")),
    },
  });
}
