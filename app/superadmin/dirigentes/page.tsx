import Link from "next/link";

import { CollapsibleCreateLeader } from "@/features/leaders/CollapsibleCreateLeader";
import { LeadersList } from "@/features/leaders/LeadersList";
import { listActiveLeaders } from "@/features/leaders/queries";

export default async function DirigentesPage() {
  const leaders = await listActiveLeaders();

  return (
    <div className="flex flex-1 flex-col gap-6 bg-zinc-50 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Dirigentes</h1>
        <Link href="/superadmin" className="text-sm text-zinc-600 underline underline-offset-2">
          Volver
        </Link>
      </div>

      <CollapsibleCreateLeader />

      <LeadersList leaders={leaders} />
    </div>
  );
}
