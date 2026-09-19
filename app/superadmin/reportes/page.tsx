import { ChevronRight, Mail, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

import { ActionBar } from "@/components/ui/ActionBar";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Screen } from "@/components/ui/Screen";
import { btnSecondaryStrong, cardClass } from "@/components/ui/styles";
import { getSuperadminStats } from "@/features/leaders/queries";

function recordsLabel(count: number): string {
  return `${count.toLocaleString("es-AR")} ${count === 1 ? "registro" : "registros"}`;
}

export default async function SuperadminReportesPage() {
  const stats = await getSuperadminStats();

  const categories = [
    { href: "/superadmin/dirigentes", label: "Dirigentes", initial: "D", count: stats.leaders },
    { href: "/superadmin/punteros", label: "Punteros", initial: "P", count: stats.pointers },
    { href: "/superadmin/personas", label: "Personas", initial: "Pe", count: stats.people },
    { href: "/superadmin/vehiculos", label: "Vehículos", initial: "V", count: stats.vehicles },
  ];

  return (
    <Screen
      title="Reportes"
      backHref="/superadmin/mas"
      bar={
        <ActionBar>
          <Link href="/superadmin/respaldos" className={btnSecondaryStrong}>
            <Mail className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            Enviar por correo
          </Link>
        </ActionBar>
      }
    >
      <section className="flex flex-col gap-2.5">
        <Eyebrow>Por categoría</Eyebrow>
        <div className={`${cardClass} overflow-hidden`}>
          {categories.map((category, index) => (
            <Link
              key={category.href}
              href={category.href}
              className={`flex items-center gap-[13px] px-4 py-[15px] transition-colors duration-150 ease-out active:bg-muted ${
                index > 0 ? "border-t border-line-inner" : ""
              }`}
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

      <section className="flex flex-col gap-2.5">
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
            <span className="text-[13px] text-ink-2">Elegí campos, filtros y formato de salida.</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-ink-ph" aria-hidden="true" />
        </Link>
      </section>
    </Screen>
  );
}
