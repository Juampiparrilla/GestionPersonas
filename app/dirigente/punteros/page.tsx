import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { ReportDownloadButtons } from "@/components/ReportDownloadButtons";
import { PointersClient } from "@/features/pointers/PointersClient";
import { listMyPointers } from "@/features/pointers/queries";
import { getLeaderWriteStatus } from "@/lib/leader-write-status";
import { getSessionContext } from "@/lib/session";

export default async function PunterosPage() {
  const session = await getSessionContext();
  const [pointers, writeStatus] = await Promise.all([
    listMyPointers(),
    getLeaderWriteStatus(session!.organizationId, session!.leaderId!),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 bg-zinc-50 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Mis Punteros</h1>
        <Link
          href="/dirigente"
          className="flex items-center gap-1 text-sm text-zinc-600 underline underline-offset-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver
        </Link>
      </div>

      <ReportDownloadButtons
        pdfHref="/api/reportes/mis-punteros/pdf"
        excelHref="/api/reportes/mis-punteros/excel"
        primaryLabel="Punteros"
        secondary={{
          label: "Personas registradas",
          pdfHref: "/api/reportes/mis-personas/pdf",
          excelHref: "/api/reportes/mis-personas/excel",
        }}
      />

      <PointersClient pointers={pointers} canWrite={writeStatus.canWrite} />
    </div>
  );
}
