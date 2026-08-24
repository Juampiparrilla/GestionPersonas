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
        <StatCard label="Dirigentes" value={stats.leaders} />
        <StatCard label="Punteros" value={stats.pointers} />
        <StatCard label="Personas registradas" value={stats.people} />
        <StatCard label="Vehículos" value={stats.vehicles} />
      </div>

      <Link
        href="/superadmin/dirigentes"
        className="flex h-14 items-center justify-center rounded-xl bg-zinc-900 text-base font-semibold text-white transition-colors hover:bg-zinc-800"
      >
        👤 Dirigentes
      </Link>
    </div>
  );
}
