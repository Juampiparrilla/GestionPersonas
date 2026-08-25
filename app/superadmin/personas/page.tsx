import Link from "next/link";

import { AllPeopleView } from "@/features/people/AllPeopleView";
import { listAllPeopleGroupedByLeader } from "@/features/people/queries";

export default async function SuperadminPersonasPage() {
  const groups = await listAllPeopleGroupedByLeader();

  return (
    <div className="flex flex-1 flex-col gap-6 bg-zinc-50 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Personas registradas</h1>
        <Link href="/superadmin/reportes" className="text-sm text-zinc-600 underline underline-offset-2">
          Volver
        </Link>
      </div>

      <AllPeopleView groups={groups} />
    </div>
  );
}
