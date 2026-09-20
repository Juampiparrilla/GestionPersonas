import { Plus } from "lucide-react";
import Link from "next/link";

import { HomeGreeting } from "@/components/ui/HomeGreeting";
import { AdminBottomNav } from "@/components/ui/RoleNav";
import { Screen } from "@/components/ui/Screen";
import { btnPrimary } from "@/components/ui/styles";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { HomeDesktop } from "@/features/dashboard/HomeDesktop";
import { getDesktopHomeData } from "@/features/dashboard/queries";
import { getSuperadminStats } from "@/features/leaders/queries";
import { SearchPanel } from "@/features/search/SearchPanel";
import { GlobalLoadingToggle } from "@/features/settings/GlobalLoadingToggle";
import { getLoadingEnabled } from "@/features/settings/queries";
import { getSessionContext } from "@/lib/session";

export default async function SuperadminHome() {
  const session = await getSessionContext();
  const [stats, loadingEnabled, desktopData] = await Promise.all([
    getSuperadminStats(),
    getLoadingEnabled(session!.organizationId!),
    getDesktopHomeData(),
  ]);

  const totalPersonas = stats.leaders + stats.pointers + stats.people;
  const promedioPersonasPorPuntero =
    stats.pointers > 0 ? Math.round(stats.people / stats.pointers) : 0;

  return (
    <Screen shell bar={<AdminBottomNav />}>
      {desktopData ? (
        <div className="hidden lg:block">
          <HomeDesktop
            data={desktopData}
            statusChip={<GlobalLoadingToggle variant="chip" loadingEnabled={loadingEnabled} />}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-4 lg:hidden">
        <HomeGreeting fullName={session!.fullName} role={session!.role} />

        <GlobalLoadingToggle loadingEnabled={loadingEnabled} />

        <SearchPanel />

        <SummaryCard
          eyebrow="Total cargado"
          columns={2}
          cells={[
            { label: "Dirigentes", value: stats.leaders },
            { label: "Punteros", value: stats.pointers },
            { label: "Personas", value: stats.people },
            { label: "Vehículos", value: stats.vehicles },
          ]}
          footnote={`${totalPersonas.toLocaleString("es-AR")} en total · promedio de ${promedioPersonasPorPuntero.toLocaleString(
            "es-AR"
          )} ${promedioPersonasPorPuntero === 1 ? "persona" : "personas"} por puntero`}
        />

        <Link href="/superadmin/carga-asistida" className={btnPrimary}>
          <Plus className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          Carga asistida
        </Link>
      </div>
    </Screen>
  );
}
