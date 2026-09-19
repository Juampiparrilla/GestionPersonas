import { ClipboardList, FileText, MailCheck, UsersRound } from "lucide-react";

import { AccessTile } from "@/components/ui/AccessTile";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { HomeGreeting } from "@/components/ui/HomeGreeting";
import { MetricsCard } from "@/components/ui/MetricsCard";
import { AdminBottomNav } from "@/components/ui/RoleNav";
import { Screen } from "@/components/ui/Screen";
import { getSuperadminStats } from "@/features/leaders/queries";
import { SearchPanel } from "@/features/search/SearchPanel";
import { GlobalLoadingToggle } from "@/features/settings/GlobalLoadingToggle";
import { getLoadingEnabled } from "@/features/settings/queries";
import { getSessionContext } from "@/lib/session";

export default async function SuperadminHome() {
  const session = await getSessionContext();
  const [stats, loadingEnabled] = await Promise.all([
    getSuperadminStats(),
    getLoadingEnabled(session!.organizationId!),
  ]);

  const totalPersonas = stats.leaders + stats.pointers + stats.people;
  const promedioPersonasPorPuntero =
    stats.pointers > 0 ? Math.round(stats.people / stats.pointers) : 0;

  return (
    <Screen bar={<AdminBottomNav />}>
      <HomeGreeting fullName={session!.fullName} role={session!.role} />

      <GlobalLoadingToggle loadingEnabled={loadingEnabled} />

      <SearchPanel />

      <MetricsCard
        eyebrow="Total cargado"
        total={totalPersonas}
        note={
          <>
            {promedioPersonasPorPuntero.toLocaleString("es-AR")}{" "}
            {promedioPersonasPorPuntero === 1 ? "persona" : "personas"}
            <br />
            por puntero
          </>
        }
        cells={[
          { label: "Dirigentes", value: stats.leaders },
          { label: "Punteros", value: stats.pointers },
          { label: "Personas", value: stats.people },
          { label: "Vehículos", value: stats.vehicles },
        ]}
      />

      <section className="flex flex-col gap-2.5">
        <Eyebrow>Accesos</Eyebrow>
        <div className="grid grid-cols-2 gap-2.5">
          <AccessTile href="/superadmin/dirigentes" label="Dirigentes" icon={UsersRound} />
          <AccessTile href="/superadmin/reportes" label="Reportes" icon={FileText} />
          <AccessTile href="/superadmin/auditoria" label="Auditoría" icon={ClipboardList} />
          <AccessTile href="/superadmin/respaldos" label="Respaldos" icon={MailCheck} />
        </div>
      </section>
    </Screen>
  );
}
