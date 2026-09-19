import { HomeGreeting } from "@/components/ui/HomeGreeting";
import { MetricsCard } from "@/components/ui/MetricsCard";
import { LeaderBottomNav } from "@/components/ui/RoleNav";
import { Screen } from "@/components/ui/Screen";
import { listMyPointers } from "@/features/pointers/queries";
import { listMyVehicles } from "@/features/vehicles/queries";
import { getLeaderWriteStatus } from "@/lib/leader-write-status";
import { getSessionContext } from "@/lib/session";

export default async function DirigenteHome() {
  const session = await getSessionContext();
  const [pointers, vehicles, writeStatus] = await Promise.all([
    listMyPointers(),
    listMyVehicles(),
    getLeaderWriteStatus(session!.organizationId!, session!.leaderId!),
  ]);

  const totalPersonas = pointers.reduce((sum, pointer) => sum + pointer.peopleCount, 0);
  const punterosSinPersonas = pointers.filter((pointer) => pointer.peopleCount === 0);
  const promedioPersonasPorPuntero =
    pointers.length > 0 ? Math.round(totalPersonas / pointers.length) : 0;

  const pausedMessage =
    writeStatus.reason === "individual_block"
      ? "Tu acceso para cargar datos está pausado. Podés consultar la información, pero no agregar ni modificar nada. Si creés que es un error, comunicate con el administrador."
      : "La carga de datos está cerrada por el momento. Podés consultar la información, pero no agregar ni modificar nada.";

  return (
    <Screen bar={<LeaderBottomNav />}>
      <HomeGreeting fullName={session!.fullName} role={session!.role} />

      {writeStatus.canWrite ? (
        <div className="flex items-center gap-3 rounded-xl border border-ok-border bg-ok-bg px-3.5 py-[11px]">
          <span className="h-2 w-2 shrink-0 rounded-full bg-ok-dot" aria-hidden="true" />
          <p className="text-sm font-semibold text-ok-ink">Carga habilitada</p>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-2xl border border-warn-border bg-warn-bg p-3.5">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-warn-dot" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-warn-ink">Carga cerrada</p>
            <p className="text-[13px] text-warn-ink">{pausedMessage}</p>
          </div>
        </div>
      )}

      {writeStatus.canWrite && punterosSinPersonas.length > 0 ? (
        <div className="flex items-start gap-3 rounded-2xl border border-warn-border bg-warn-bg p-3.5">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-warn-dot" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-warn-ink">
              Tenés {punterosSinPersonas.length}{" "}
              {punterosSinPersonas.length === 1
                ? "puntero sin personas registradas"
                : "punteros sin personas registradas"}
            </p>
            <p className="text-[13px] text-warn-ink">
              {punterosSinPersonas
                .slice(0, 3)
                .map((pointer) => pointer.fullName)
                .join(", ")}
              {punterosSinPersonas.length > 3 ? ` y ${punterosSinPersonas.length - 3} más` : ""}
            </p>
          </div>
        </div>
      ) : null}

      <MetricsCard
        eyebrow="Personas registradas"
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
          { label: "Punteros", value: pointers.length },
          { label: "Vehículos", value: vehicles.length },
        ]}
      />
    </Screen>
  );
}
