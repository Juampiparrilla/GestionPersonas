import Link from "next/link";

import { AllPointersView } from "@/features/pointers/AllPointersView";
import { listAllPointersGroupedByLeader } from "@/features/pointers/queries";

export default async function SuperadminPunterosPage() {
  const groups = await listAllPointersGroupedByLeader();

  return (
    <div className="flex flex-1 flex-col gap-6 bg-zinc-50 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Punteros</h1>
        <Link href="/superadmin/reportes" className="text-sm text-zinc-600 underline underline-offset-2">
          Volver
        </Link>
      </div>

      <AllPointersView groups={groups} />
    </div>
  );
}
