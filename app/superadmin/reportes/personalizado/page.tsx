import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { listActiveLeaders } from "@/features/leaders/queries";
import { listAllPointersGroupedByLeader } from "@/features/pointers/queries";
import { CustomReportForm } from "@/features/reports/CustomReportForm";

export default async function ReportePersonalizadoPage() {
  const [leaders, pointerGroups] = await Promise.all([listActiveLeaders(), listAllPointersGroupedByLeader()]);

  const pointers = pointerGroups.flatMap((group) =>
    group.pointers.map((pointer) => ({
      id: pointer.id,
      fullName: pointer.fullName,
      leaderName: group.leaderName,
    }))
  );

  return (
    <div className="flex flex-1 flex-col gap-6 bg-zinc-50 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Reporte personalizado</h1>
        <Link
          href="/superadmin/reportes"
          className="flex items-center gap-1 text-sm text-zinc-600 underline underline-offset-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver
        </Link>
      </div>

      <div className="rounded-xl border-2 border-zinc-300 bg-white p-4">
        <CustomReportForm leaders={leaders.map((leader) => ({ id: leader.id, fullName: leader.fullName }))} pointers={pointers} />
      </div>
    </div>
  );
}
