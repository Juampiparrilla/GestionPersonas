import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { fetchAuditLogsAction } from "@/features/audit/actions";
import { AuditLogClient } from "@/features/audit/AuditLogClient";
import { listActiveLeaders } from "@/features/leaders/queries";

export default async function SuperadminAuditoriaPage() {
  const [rows, leaders] = await Promise.all([fetchAuditLogsAction({}), listActiveLeaders()]);

  return (
    <div className="flex flex-1 flex-col gap-6 bg-zinc-50 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Auditoría</h1>
        <Link
          href="/superadmin"
          className="flex items-center gap-1 text-sm text-zinc-600 underline underline-offset-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver
        </Link>
      </div>

      <AuditLogClient
        initialRows={rows}
        leaders={leaders.map((leader) => ({ id: leader.id, fullName: leader.fullName }))}
      />
    </div>
  );
}
