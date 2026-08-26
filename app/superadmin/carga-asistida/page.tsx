import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { CargaAsistidaClient } from "@/features/carga-asistida/CargaAsistidaClient";
import { listActiveLeaders } from "@/features/leaders/queries";
import { listAllPointersGroupedByLeader } from "@/features/pointers/queries";

export default async function CargaAsistidaPage() {
  const [leaders, pointerGroups] = await Promise.all([listActiveLeaders(), listAllPointersGroupedByLeader()]);

  return (
    <div className="flex flex-1 flex-col gap-6 bg-zinc-50 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Carga asistida</h1>
        <Link
          href="/superadmin"
          className="flex items-center gap-1 text-sm text-zinc-600 underline underline-offset-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver
        </Link>
      </div>

      <p className="text-sm text-zinc-500">
        Cargá un puntero, una persona o un vehículo en nombre de un dirigente. Queda registrado en la
        auditoría con tu nombre como quien lo hizo.
      </p>

      <div className="rounded-xl border-2 border-zinc-300 bg-white p-4">
        <CargaAsistidaClient
          leaders={leaders.map((leader) => ({ id: leader.id, fullName: leader.fullName }))}
          pointerGroups={pointerGroups.map((group) => ({
            leaderId: group.leaderId,
            leaderName: group.leaderName,
            pointers: group.pointers.map((pointer) => ({ id: pointer.id, fullName: pointer.fullName })),
          }))}
        />
      </div>
    </div>
  );
}
