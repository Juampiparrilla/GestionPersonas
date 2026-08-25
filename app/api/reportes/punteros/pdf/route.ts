import { NextResponse } from "next/server";

import { listAllPointersGroupedByLeader } from "@/features/pointers/queries";
import { getSessionContext } from "@/lib/session";
import { buildPointersReportPdf } from "@/lib/reports/pointersReport";

export async function GET() {
  const session = await getSessionContext();
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const groups = await listAllPointersGroupedByLeader();
  const buffer = await buildPointersReportPdf(groups);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="punteros-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
