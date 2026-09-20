import { ChevronRight, Mail, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

import { TopbarActions } from "@/components/desktop/ShellContext";
import { AdminBottomNav } from "@/components/ui/RoleNav";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Screen } from "@/components/ui/Screen";
import { cardClass } from "@/components/ui/styles";
import { getSuperadminStats, listActiveLeaders } from "@/features/leaders/queries";
import { listAllPointersGroupedByLeader } from "@/features/pointers/queries";
import { CustomReportForm } from "@/features/reports/CustomReportForm";

function recordsLabel(count: number): string {
  return `${count.toLocaleString("es-AR")} ${count === 1 ? "registro" : "registros"}`;
}

// Reportes: plantillas por categoria (cada una lleva a su listado, donde se
// exporta) + el constructor de reporte a medida. En escritorio el constructor
// es el panel de la derecha; en movil es su propia pantalla (Mas > Reporte
// personalizado).
export default async function SuperadminReportesPage() {
  const [stats, leaders, pointerGroups] = await Promise.all([
    getSuperadminStats(),
    listActiveLeaders(),
    listAllPointersGroupedByLeader(),
  ]);

  const pointers = pointerGroups.flatMap((group) =>
    group.pointers.map((pointer) => ({
      id: pointer.id,
      fullName: pointer.fullName,
      leaderName: group.leaderName,
    }))
  );

  const categories = [
    { href: "/superadmin/dirigentes", label: "Dirigentes", initial: "D", count: stats.leaders },
    { href: "/superadmin/punteros", label: "Punteros", initial: "P", count: stats.pointers },
    { href: "/superadmin/personas", label: "Personas", initial: "Pe", count: stats.people },
    { href: "/superadmin/vehiculos", label: "Vehículos", initial: "V", count: stats.vehicles },
  ];

  return (
    <Screen shell desktopContent title="Reportes" backHref="/superadmin/mas" bar={<AdminBottomNav />}>
      <TopbarActions>
        <Link
          href="/superadmin/envio-correo"
          className="flex h-9 items-center gap-1.5 rounded-[10px] border border-line-input bg-surface px-3.5 text-sm font-semibold text-ink-label transition-colors duration-150 ease-out hover:bg-muted"
        >
          <Mail className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          Programar envío
        </Link>
      </TopbarActions>

      <div className="flex flex-col lg:h-[calc(100dvh-60px)] lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-5 lg:overflow-y-auto lg:p-6">
          <div className="hidden flex-col gap-1 lg:flex">
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">Reportes</h1>
            <p className="text-[15px] text-ink-2">
              Elegí una categoría para ver y exportar, o armá uno a medida con el constructor de la
              derecha.
            </p>
          </div>

          <section className="flex flex-col gap-2.5">
            <Eyebrow>Por categoría</Eyebrow>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {categories.map((category) => (
                <Link
                  key={category.href}
                  href={category.href}
                  className={`${cardClass} flex items-center gap-[13px] rounded-[14px] px-4 py-[15px] transition-colors duration-150 ease-out active:bg-muted lg:hover:bg-app`}
                >
                  <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-muted font-mono text-sm font-semibold text-ink-label">
                    {category.initial}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-base font-semibold text-ink">{category.label}</span>
                    <span className="text-[13px] text-ink-2">{recordsLabel(category.count)}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-ph" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-2.5 lg:hidden">
            <Eyebrow>A medida</Eyebrow>
            <Link
              href="/superadmin/reportes/personalizado"
              className="flex items-center gap-[13px] rounded-[18px] border border-dashed border-line-dashed bg-surface p-4 transition-colors duration-150 ease-out active:bg-muted"
            >
              <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-muted text-ink-label">
                <SlidersHorizontal className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-base font-semibold text-ink">Reporte personalizado</span>
                <span className="text-[13px] text-ink-2">Elegí qué incluir y de quién.</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-ph" aria-hidden="true" />
            </Link>
          </section>
        </div>

        <aside className="hidden w-[376px] shrink-0 flex-col overflow-y-auto border-l border-line bg-bar lg:flex">
          <div className="border-b border-line px-6 py-5">
            <h2 className="text-[19px] font-semibold tracking-[-0.015em] text-ink">Reporte a medida</h2>
            <p className="mt-1 text-[13px] text-ink-2">
              Elegí qué incluir y de quién; se descarga en PDF.
            </p>
          </div>
          <div className="p-5">
            <CustomReportForm
              leaders={leaders.map((leader) => ({ id: leader.id, fullName: leader.fullName }))}
              pointers={pointers}
            />
          </div>
        </aside>
      </div>
    </Screen>
  );
}
