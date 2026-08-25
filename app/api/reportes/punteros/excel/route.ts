import { NextResponse } from "next/server";

import { listAllPointersGroupedByLeader } from "@/features/pointers/queries";
import { getSessionContext } from "@/lib/session";
import { buildReportFilename, contentDispositionHeader } from "@/lib/reports/filename";
import { buildPointersReportExcel } from "@/lib/reports/pointersReport";

export async function GET() {
  const session = await getSessionContext();
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const groups = await listAllPointersGroupedByLeader();
  const buffer = await buildPointersReportExcel(groups);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": contentDispositionHeader(buildReportFilename(["Punteros"], "xlsx")),
    },
  });
}
