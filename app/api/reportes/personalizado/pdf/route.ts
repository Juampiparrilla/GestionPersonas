import { type NextRequest, NextResponse } from "next/server";

import { getLeaderBasics } from "@/features/leaders/queries";
import { listAllPeopleGroupedByLeader, listPeopleForPointer } from "@/features/people/queries";
import type { PersonLeaderGroup } from "@/features/people/queries";
import { getPointerBasics, listAllPointersGroupedByLeader } from "@/features/pointers/queries";
import { listAllVehiclesGroupedByLeader } from "@/features/vehicles/queries";
import { getSessionContext } from "@/lib/session";
import { buildReportFilename, contentDispositionHeader } from "@/lib/reports/filename";
import { buildPeopleReportPdf } from "@/lib/reports/peopleReport";
import { buildPointersReportPdf } from "@/lib/reports/pointersReport";
import { buildVehiclesReportPdf } from "@/lib/reports/vehiclesReport";

function pdfResponse(buffer: Buffer, filename: string) {
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": contentDispositionHeader(filename),
    },
  });
}

export async function GET(request: NextRequest) {
  const session = await getSessionContext();
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const type = request.nextUrl.searchParams.get("type");
  const leaderId = request.nextUrl.searchParams.get("leaderId");
  const pointerId = request.nextUrl.searchParams.get("pointerId");

  if (type === "dirigente-punteros") {
    if (!leaderId) return NextResponse.json({ error: "Falta el dirigente" }, { status: 400 });
    const group = (await listAllPointersGroupedByLeader()).find((g) => g.leaderId === leaderId);
    if (!group) return NextResponse.json({ error: "Dirigente no encontrado" }, { status: 404 });
    const buffer = await buildPointersReportPdf([group]);
    return pdfResponse(buffer, buildReportFilename([group.leaderName, "Punteros"], "pdf"));
  }

  if (type === "dirigente-personas") {
    if (!leaderId) return NextResponse.json({ error: "Falta el dirigente" }, { status: 400 });
    const group = (await listAllPeopleGroupedByLeader()).find((g) => g.leaderId === leaderId);
    if (!group) return NextResponse.json({ error: "Dirigente no encontrado" }, { status: 404 });
    const buffer = await buildPeopleReportPdf([group]);
    return pdfResponse(buffer, buildReportFilename([group.leaderName, "Personas"], "pdf"));
  }

  if (type === "puntero-personas") {
    if (!pointerId) return NextResponse.json({ error: "Falta el puntero" }, { status: 400 });
    const pointer = await getPointerBasics(pointerId);
    if (!pointer) return NextResponse.json({ error: "Puntero no encontrado" }, { status: 404 });
    const leader = await getLeaderBasics(pointer.leaderId);
    const leaderName = leader?.fullName ?? "-";
    const people = await listPeopleForPointer(pointerId);
    const groups: PersonLeaderGroup[] = [
      {
        leaderId: pointer.leaderId,
        leaderName: `Dirigente: ${leaderName}`,
        pointerGroups: [{ pointerId, pointerName: pointer.fullName, people }],
      },
    ];
    const buffer = await buildPeopleReportPdf(groups);
    return pdfResponse(buffer, buildReportFilename([leaderName, pointer.fullName, "Personas"], "pdf"));
  }

  if (type === "vehiculos") {
    if (!leaderId) return NextResponse.json({ error: "Falta el dirigente" }, { status: 400 });
    const group = (await listAllVehiclesGroupedByLeader()).find((g) => g.leaderId === leaderId);
    if (!group) return NextResponse.json({ error: "Dirigente no encontrado" }, { status: 404 });
    const buffer = await buildVehiclesReportPdf([group]);
    return pdfResponse(buffer, buildReportFilename([group.leaderName, "Vehículos"], "pdf"));
  }

  return NextResponse.json({ error: "Tipo de reporte inválido" }, { status: 400 });
}
