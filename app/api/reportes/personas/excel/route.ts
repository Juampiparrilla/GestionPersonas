import { NextResponse } from "next/server";

import { listAllPeopleGroupedByLeader } from "@/features/people/queries";
import { getSessionContext } from "@/lib/session";
import { buildPeopleReportExcel } from "@/lib/reports/peopleReport";

export async function GET() {
  const session = await getSessionContext();
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const groups = await listAllPeopleGroupedByLeader();
  const buffer = await buildPeopleReportExcel(groups);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="personas-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
