import { type NextRequest, NextResponse } from "next/server";

import { listPeopleForPointer } from "@/features/people/queries";
import type { PersonLeaderGroup } from "@/features/people/queries";
import { getPointerBasics } from "@/features/pointers/queries";
import { getSessionContext } from "@/lib/session";
import { buildPeopleReportPdf } from "@/lib/reports/peopleReport";

export async function GET(request: NextRequest) {
  const session = await getSessionContext();
  if (!session || session.role !== "leader" || !session.leaderId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const pointerId = request.nextUrl.searchParams.get("pointerId");
  if (!pointerId) {
    return NextResponse.json({ error: "Falta el puntero" }, { status: 400 });
  }

  const pointer = await getPointerBasics(pointerId);
  if (!pointer || pointer.leaderId !== session.leaderId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const people = await listPeopleForPointer(pointerId);
  const groups: PersonLeaderGroup[] = [
    {
      leaderId: session.leaderId,
      leaderName: `Dirigente: ${session.fullName}`,
      pointerGroups: [{ pointerId, pointerName: pointer.fullName, people }],
    },
  ];
  const buffer = await buildPeopleReportPdf(groups);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="mis-personas-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
