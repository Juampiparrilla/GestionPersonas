import { BarChart3, Car, Divide, Sigma, UserRound, UserRoundPlus, UsersRound } from "lucide-react";
import Link from "next/link";

import { LogoutButton } from "@/components/LogoutButton";
import { StatCard } from "@/components/StatCard";
import { getSuperadminStats } from "@/features/leaders/queries";
import { GlobalLoadingToggle } from "@/features/settings/GlobalLoadingToggle";
import { getLoadingEnabled } from "@/features/settings/queries";
import { SearchPanel } from "@/features/search/SearchPanel";
import { getSessionContext } from "@/lib/session";

export default async function SuperadminHome() {
  const session = await getSessionContext();
  const [stats, loadingEnabled] = await Promise.all([
    getSuperadminStats(),
    getLoadingEnabled(session!.organizationId),
  ]);

  const totalPersonas = stats.leaders + stats.pointers + stats.people;
  const promedioPersonasPorPuntero = stats.pointers > 0 ? Math.round(stats.people / stats.pointers) : 0;

  return (
    <div className="flex flex-1 flex-col gap-6 bg-zinc-50 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">
          Bienvenido, {session?.fullName}
        </h1>
        <LogoutButton />
      </div>

      <GlobalLoadingToggle loadingEnabled={loadingEnabled} />

      <SearchPanel />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Dirigentes" value={stats.leaders} icon={UserRound} />
        <StatCard label="Punteros" value={stats.pointers} icon={UserRoundPlus} />
        <StatCard label="Personas registradas" value={stats.people} icon={UsersRound} />
        <StatCard label="Vehículos" value={stats.vehicles} icon={Car} />
        <StatCard
          label="Total de personas"
          value={totalPersonas}
          icon={Sigma}
          hint="Dirigentes + punteros + personas"
        />
        <StatCard
          label="Promedio de personas por puntero"
          value={promedioPersonasPorPuntero}
          icon={Divide}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/superadmin/dirigentes"
          className="flex h-14 items-center justify-center gap-2 rounded-xl bg-zinc-900 text-base font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          <UserRoundPlus className="h-5 w-5" aria-hidden="true" />
          Dirigentes
        </Link>
        <Link
          href="/superadmin/reportes"
          className="flex h-14 items-center justify-center gap-2 rounded-xl bg-zinc-900 text-base font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          <BarChart3 className="h-5 w-5" aria-hidden="true" />
          Reportes
        </Link>
      </div>
    </div>
  );
}
