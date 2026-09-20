"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { TopbarActions } from "@/components/desktop/ShellContext";
import { Avatar } from "@/components/ui/Avatar";

function Kpi({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-surface px-[18px] py-4">
      <span className="font-mono text-[12px] font-medium uppercase tracking-[0.1em] text-ink-3">
        {label}
      </span>
      <span className="text-[34px] font-semibold leading-none tracking-[-0.03em] text-ink">
        {value.toLocaleString("es-AR")}
      </span>
      <span className="text-[12px] text-ink-2">{note}</span>
    </div>
  );
}

// Inicio de escritorio del Dirigente: cuatro tarjetas y los punteros que
// todavia no tienen personas (lo que hay que atender).
export function LeaderHomeDesktop({
  pointers,
  people,
  vehicles,
  average,
  withoutPeople,
  canWrite,
  pausedMessage,
}: {
  pointers: number;
  people: number;
  vehicles: number;
  average: number;
  withoutPeople: { id: string; fullName: string; dni: string }[];
  canWrite: boolean;
  pausedMessage: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <TopbarActions>
        <span
          title={canWrite ? undefined : pausedMessage}
          className={`flex h-9 items-center gap-2 rounded-[10px] border px-3 text-sm font-semibold ${
            canWrite
              ? "border-ok-border bg-ok-bg text-ok-ink"
              : "border-warn-border bg-warn-bg text-warn-ink"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${canWrite ? "bg-ok-dot" : "bg-warn-dot"}`}
            aria-hidden="true"
          />
          {canWrite ? "Carga habilitada" : "Carga cerrada"}
        </span>
      </TopbarActions>

      <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">Inicio</h1>

      {canWrite ? null : (
        <p className="rounded-2xl border border-warn-border bg-warn-bg p-3.5 text-sm text-warn-ink">
          {pausedMessage}
        </p>
      )}

      <div className="grid grid-cols-4 gap-3.5">
        <Kpi label="Punteros" value={pointers} note={withoutPeople.length > 0 ? `${withoutPeople.length} sin personas` : "todos con personas"} />
        <Kpi
          label="Personas"
          value={people}
          note={`en ${pointers} ${pointers === 1 ? "puntero" : "punteros"}`}
        />
        <Kpi label="Vehículos" value={vehicles} note="cargados por vos" />
        <Kpi label="Promedio" value={average} note="personas por puntero" />
      </div>

      <section className="flex flex-col overflow-hidden rounded-[14px] border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line-inner px-6 py-4">
          <h2 className="text-[15px] font-semibold text-ink">Punteros sin personas</h2>
          <Link href="/dirigente/punteros" className="text-[13px] font-semibold text-link">
            Ver todos
          </Link>
        </div>
        {withoutPeople.length === 0 ? (
          <p className="p-6 text-sm text-ink-2">
            Todos tus punteros tienen personas registradas. Buen trabajo.
          </p>
        ) : (
          withoutPeople.map((pointer, index) => (
            <Link
              key={pointer.id}
              href={`/dirigente/punteros?detalle=${pointer.id}`}
              className={`flex items-center gap-3 px-6 py-3 hover:bg-app ${index > 0 ? "border-t border-line-row" : ""}`}
            >
              <Avatar name={pointer.fullName} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">{pointer.fullName}</span>
                <span className="block font-mono text-[12px] font-medium text-ink-2">DNI {pointer.dni}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-ink-ph" aria-hidden="true" />
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
