import { NextResponse } from "next/server";

import { listMyPointers, type PointerLeaderGroup } from "@/features/pointers/queries";
import { getSessionContext } from "@/lib/session";
import { buildPointersReportPdf } from "@/lib/reports/pointersReport";

export async function GET() {
  const session = await getSessionContext();
  if (!session || session.role !== "leader" || !session.leaderId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const pointers = await listMyPointers();
  const groups: PointerLeaderGroup[] = [
    { leaderId: session.leaderId, leaderName: `Dirigente: ${session.fullName}`, pointers },
  ];
  const buffer = await buildPointersReportPdf(groups);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="mis-punteros-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
