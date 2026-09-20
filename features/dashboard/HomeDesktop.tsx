"use client";

import Link from "next/link";
import { useState } from "react";

import { TopbarActions } from "@/components/desktop/ShellContext";

import type { DesktopHomeData } from "./queries";

const KPIS = [
  { key: "leaders", label: "Dirigentes" },
  { key: "pointers", label: "Punteros" },
  { key: "people", label: "Personas" },
  { key: "vehicles", label: "Vehículos" },
] as const;

function Kpi({ label, value, delta }: { label: string; value: number; delta: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-surface px-[18px] py-4">
      <span className="font-mono text-[12px] font-medium uppercase tracking-[0.1em] text-ink-3">
        {label}
      </span>
      <span className="text-[34px] font-semibold leading-none tracking-[-0.03em] text-ink">
        {value.toLocaleString("es-AR")}
      </span>
      <span className="text-[12px] text-ink-2">{delta}</span>
    </div>
  );
}

// Barras verticales sin ejes ni grilla (el detalle numerico vive en las
// tarjetas): la del dia actual en el acento.
function PerDayChart({ perDay, days }: { perDay: DesktopHomeData["perDay"]; days: 7 | 30 }) {
  const shown = perDay.slice(-days);
  const max = Math.max(1, ...shown.map((day) => day.count));

  return (
    <div className="flex h-[300px] items-end gap-2 px-6 pb-4 pt-6" role="img" aria-label={`Cargas por día, últimos ${days} días`}>
      {shown.map((day, index) => {
        const isToday = index === shown.length - 1;
        return (
          <div key={day.date} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
            <span className="font-mono text-[11px] font-medium text-ink-2">
              {day.count > 0 ? day.count : ""}
            </span>
            <div
              className={`w-full rounded-t-[5px] ${isToday ? "bg-accent" : "bg-[#e4e4df]"}`}
              style={{ height: `${Math.max(4, (day.count / max) * 100)}%`, maxHeight: "calc(100% - 44px)" }}
            />
            <span
              className={`font-mono text-[11px] ${isToday ? "font-semibold text-ink" : "font-medium text-ink-3"}`}
            >
              {days === 30 && index % 2 !== 0 ? "" : day.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Inicio de escritorio: cuatro tarjetas, altas por dia y actividad.
export function HomeDesktop({
  data,
  statusChip,
}: {
  data: DesktopHomeData;
  statusChip: React.ReactNode;
}) {
  const [days, setDays] = useState<7 | 30>(7);

  return (
    <div className="flex flex-col gap-5">
      <TopbarActions>{statusChip}</TopbarActions>

      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">Inicio</h1>
        <span className="font-mono text-[13px] font-medium text-ink-2">
          Actualizado {data.updatedAt}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3.5">
        {KPIS.map((kpi) => (
          <Kpi key={kpi.key} label={kpi.label} value={data.stats[kpi.key]} delta={data.deltas[kpi.key]} />
        ))}
      </div>

      <div className="grid min-h-[380px] grid-cols-[1.55fr_1fr] gap-4">
        <section className="flex flex-col overflow-hidden rounded-[14px] border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line-inner px-6 py-4">
            <h2 className="text-[15px] font-semibold text-ink">Cargas por día</h2>
            <div className="flex gap-1.5" role="group" aria-label="Rango del gráfico">
              {([7, 30] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDays(option)}
                  aria-pressed={days === option}
                  className={`h-7 rounded-lg px-3 text-[12px] font-semibold ${
                    days === option ? "bg-ink text-white" : "border border-line-input bg-surface text-ink-label hover:bg-muted"
                  }`}
                >
                  {option} días
                </button>
              ))}
            </div>
          </div>
          <PerDayChart perDay={data.perDay} days={days} />
        </section>

        <section className="flex flex-col overflow-hidden rounded-[14px] border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line-inner px-6 py-4">
            <h2 className="text-[15px] font-semibold text-ink">Actividad</h2>
            <Link href="/superadmin/auditoria" className="text-[13px] font-semibold text-link">
              Ver todo
            </Link>
          </div>
          {data.activity.length === 0 ? (
            <p className="p-6 text-sm text-ink-2">Todavía no hay actividad.</p>
          ) : (
            data.activity.map((entry, index) => (
              <div
                key={entry.id}
                className={`flex gap-4 px-6 py-3.5 ${index > 0 ? "border-t border-line-row" : ""}`}
              >
                <span className="w-[44px] shrink-0 pt-0.5 font-mono text-[12px] font-medium text-ink-3">
                  {entry.time}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-ink">{entry.title}</p>
                  <p className="truncate text-[13px] text-ink-2">{entry.detail}</p>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
