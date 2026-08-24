import Link from "next/link";

import { StatCard } from "@/components/StatCard";
import { LogoutButton } from "@/components/LogoutButton";
import { listMyPointers } from "@/features/pointers/queries";
import { listMyVehicles } from "@/features/vehicles/queries";
import { getLeaderWriteStatus } from "@/lib/leader-write-status";
import { getSessionContext } from "@/lib/session";

export default async function DirigenteHome() {
  const session = await getSessionContext();
  const [pointers, vehicles, writeStatus] = await Promise.all([
    listMyPointers(),
    listMyVehicles(),
    getLeaderWriteStatus(session!.organizationId, session!.leaderId!),
  ]);

  const totalPersonas = pointers.reduce((sum, pointer) => sum + pointer.peopleCount, 0);
  const punterosSinPersonas = pointers.filter((pointer) => pointer.peopleCount === 0);
  const promedioPersonasPorPuntero =
    pointers.length > 0 ? Math.round(totalPersonas / pointers.length) : 0;

  if (!writeStatus.canWrite) {
    const message =
      writeStatus.reason === "individual_block"
        ? "Tu acceso para cargar datos está pausado. Podés consultar la información, pero no agregar ni modificar nada. Si creés que es un error, comunicate con el administrador."
        : "La carga de datos está cerrada por el momento. Podés consultar la información, pero no agregar ni modificar nada.";

    return (
      <div className="flex flex-1 flex-col gap-6 bg-zinc-50 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">Bienvenido, {session?.fullName}</h1>
          <LogoutButton />
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-medium text-amber-900">🔒 Reporte general</p>
          <p className="mt-1 text-sm text-amber-800">{message}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Punteros" value={pointers.length} />
          <StatCard label="Personas registradas" value={totalPersonas} />
          <StatCard label="Vehículos" value={vehicles.length} />
          <StatCard label="Promedio de personas por puntero" value={promedioPersonasPorPuntero} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 bg-zinc-50 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Bienvenido, {session?.fullName}</h1>
        <LogoutButton />
      </div>

      {punterosSinPersonas.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-medium text-amber-900">
            ⚠️ Tenés {punterosSinPersonas.length}{" "}
            {punterosSinPersonas.length === 1
              ? "puntero sin personas registradas"
              : "punteros sin personas registradas"}
          </p>
          <p className="mt-1 text-sm text-amber-800">
            {punterosSinPersonas
              .slice(0, 3)
              .map((pointer) => pointer.fullName)
              .join(", ")}
            {punterosSinPersonas.length > 3 ? ` y ${punterosSinPersonas.length - 3} más` : ""}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Punteros" value={pointers.length} />
        <StatCard label="Personas registradas" value={totalPersonas} />
        <StatCard label="Vehículos" value={vehicles.length} />
        <StatCard label="Promedio de personas por puntero" value={promedioPersonasPorPuntero} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/dirigente/punteros"
          className="flex h-16 items-center justify-center gap-2 rounded-xl bg-zinc-900 text-lg font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          👤+ PUNTEROS
        </Link>
        <Link
          href="/dirigente/vehiculos"
          className="flex h-16 items-center justify-center gap-2 rounded-xl bg-zinc-900 text-lg font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          🚗+ VEHÍCULOS
        </Link>
      </div>
    </div>
  );
}
