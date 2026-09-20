"use client";

import { MoreHorizontal, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ActionBar } from "@/components/ui/ActionBar";
import { Avatar } from "@/components/ui/Avatar";
import { FilterChip } from "@/components/ui/Chip";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Screen } from "@/components/ui/Screen";
import { btnIcon, btnPrimary, cardClass } from "@/components/ui/styles";
import { formatPhoneDisplay } from "@/utils/phone";

import type { ActivityRow, DetailRow } from "./detailTypes";
import { LeaderRowActions } from "./LeaderRowActions";
import type { LeaderListItem } from "./queries";

export type { ActivityRow, DetailRow };

type Tab = "pointers" | "people" | "vehicles";

const TAB_LABEL: Record<Tab, string> = {
  pointers: "Punteros",
  people: "Personas",
  vehicles: "Vehículos",
};

const ADD_LABEL: Record<Tab, string> = {
  pointers: "Agregar puntero a este dirigente",
  people: "Agregar persona a este dirigente",
  vehicles: "Agregar vehículo a este dirigente",
};

const OPERATION_PARAM: Record<Tab, string> = {
  pointers: "pointer",
  people: "person",
  vehicles: "vehicle",
};

export function LeaderCounters({
  pointers,
  people,
  vehicles,
}: {
  pointers: number;
  people: number;
  vehicles: number;
}) {
  const counters = [
    { key: "pointers", count: pointers, singular: "Puntero", plural: "Punteros" },
    { key: "people", count: people, singular: "Persona", plural: "Personas" },
    { key: "vehicles", count: vehicles, singular: "Vehículo", plural: "Vehículos" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {counters.map((counter) => (
        <div
          key={counter.key}
          className="flex flex-col items-center rounded-[13px] border border-line bg-surface p-2.5"
        >
          <span className="text-xl font-semibold text-ink">
            {counter.count.toLocaleString("es-AR")}
          </span>
          <span className="text-[11px] text-ink-2">
            {counter.count === 1 ? counter.singular : counter.plural}
          </span>
        </div>
      ))}
    </div>
  );
}

// Pestañas (Punteros / Personas / Vehículos) con la lista de lo que cuelga del
// dirigente + acceso a cargar mas, y su ultima actividad. Es el contenido de la
// ficha, tanto en la pantalla movil como en el panel lateral de escritorio.
// `onAdd` reemplaza al link a la carga asistida (escritorio: abre el panel).
export function LeaderTabsAndActivity({
  leaderId,
  pointers,
  people,
  vehicles,
  activity,
  onAdd,
}: {
  leaderId: string;
  pointers: DetailRow[];
  people: DetailRow[];
  vehicles: DetailRow[];
  activity: ActivityRow[];
  onAdd?: (operation: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("pointers");
  const rows = { pointers, people, vehicles }[tab];
  const addClass = "flex min-h-[48px] w-full items-center gap-2 px-3.5 py-3 text-left text-[14px] font-semibold text-link";
  const addBorder = rows.length > 0 ? "border-t border-line-inner" : "";

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TAB_LABEL) as Tab[]).map((key) => (
          <FilterChip key={key} active={tab === key} onClick={() => setTab(key)}>
            {TAB_LABEL[key]}
          </FilterChip>
        ))}
      </div>

      <div className={`${cardClass} overflow-hidden`}>
        {rows.map((row, index) => (
          <div
            key={row.id}
            className={`flex items-center gap-3 px-3.5 py-3 ${index > 0 ? "border-t border-line-inner" : ""}`}
          >
            <Avatar name={row.name} size="sm" tone="muted" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-ink">{row.name}</p>
              <p className="truncate font-mono text-[12px] font-medium text-ink-2">{row.meta}</p>
            </div>
          </div>
        ))}
        {onAdd ? (
          <button type="button" onClick={() => onAdd(OPERATION_PARAM[tab])} className={`${addClass} ${addBorder}`}>
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            {ADD_LABEL[tab]}
          </button>
        ) : (
          <Link
            href={`/superadmin/carga-asistida?leaderId=${leaderId}&tipo=${OPERATION_PARAM[tab]}`}
            className={`${addClass} ${addBorder}`}
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            {ADD_LABEL[tab]}
          </Link>
        )}
      </div>

      {activity.length > 0 ? (
        <section className={`${cardClass} flex flex-col gap-2.5 p-4`}>
          <Eyebrow>Última actividad</Eyebrow>
          {activity.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3">
              <span className="w-[44px] shrink-0 pt-px font-mono text-[12px] font-medium text-ink-3">
                {entry.time}
              </span>
              <p className="text-[13px] text-ink-label">{entry.description}</p>
            </div>
          ))}
        </section>
      ) : null}
    </>
  );
}

export function LeaderDetailClient({
  leader,
  pointers,
  people,
  vehicles,
  activity,
}: {
  leader: LeaderListItem;
  pointers: DetailRow[];
  people: DetailRow[];
  vehicles: DetailRow[];
  activity: ActivityRow[];
}) {
  const router = useRouter();
  // "Editar" abre el formulario de edicion; "⋯" abre el resto de las
  // acciones (acceso, invitacion, quitar). Nunca las dos a la vez.
  const [panel, setPanel] = useState<"edit" | "actions" | null>(null);

  return (
    <Screen
      shell
      backHref="/superadmin/dirigentes"
      headerRight={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPanel(panel === "edit" ? null : "edit")}
            aria-expanded={panel === "edit"}
            className="flex h-9 items-center rounded-xl border border-line-input bg-surface px-[13px] text-[13px] font-semibold text-ink-label active:bg-muted"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => setPanel(panel === "actions" ? null : "actions")}
            aria-label="Más acciones"
            aria-expanded={panel === "actions"}
            className={`${btnIcon} !h-9 !w-9`}
          >
            <MoreHorizontal className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      }
      headerExtra={
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center gap-3.5">
            <Avatar name={leader.fullName} size="lg" />
            <div className="min-w-0">
              <h1 className="text-[22px] font-semibold tracking-[-0.015em] text-ink">
                {leader.fullName}
              </h1>
              <p className="font-mono text-[13px] font-medium text-ink-2">
                DNI {leader.dni}
                {leader.phone ? ` · ${formatPhoneDisplay(leader.phone)}` : ""}
              </p>
            </div>
          </div>
          <LeaderCounters pointers={pointers.length} people={people.length} vehicles={vehicles.length} />
        </div>
      }
      bar={
        <ActionBar>
          <Link
            href={`/superadmin/carga-asistida?leaderId=${leader.id}`}
            className={btnPrimary}
          >
            <Plus className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
            Cargar bajo este dirigente
          </Link>
        </ActionBar>
      }
    >
      <div className="mx-auto flex w-full max-w-[560px] flex-col gap-4">
        <div className="hidden flex-col gap-4 lg:flex">
          <div className="flex items-center gap-3.5">
            <Avatar name={leader.fullName} size="lg" />
            <div className="min-w-0">
              <h1 className="text-[22px] font-semibold tracking-[-0.015em] text-ink">
                {leader.fullName}
              </h1>
              <p className="font-mono text-[13px] font-medium text-ink-2">
                DNI {leader.dni}
                {leader.phone ? ` · ${formatPhoneDisplay(leader.phone)}` : ""}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPanel(panel === "edit" ? null : "edit")}
                className="flex h-9 items-center rounded-xl border border-line-input bg-surface px-[13px] text-[13px] font-semibold text-ink-label hover:bg-muted"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => setPanel(panel === "actions" ? null : "actions")}
                aria-label="Más acciones"
                className={`${btnIcon} !h-9 !w-9`}
              >
                <MoreHorizontal className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
          </div>
          <LeaderCounters pointers={pointers.length} people={people.length} vehicles={vehicles.length} />
        </div>

        {panel ? (
          <section className={`${cardClass} p-3.5`}>
            <LeaderRowActions
              leaderId={leader.id}
              fullName={leader.fullName}
              phone={leader.phone}
              address={leader.address}
              accessStatus={leader.accessStatus}
              pointerCount={leader.pointerCount}
              hasAccess={leader.hasAccess}
              accepted={leader.accepted}
              isEditing={panel === "edit"}
              onStartEdit={() => setPanel("edit")}
              onStopEdit={() => setPanel(null)}
              onRemoved={() => router.push("/superadmin/dirigentes")}
            />
          </section>
        ) : null}

        <LeaderTabsAndActivity
          leaderId={leader.id}
          pointers={pointers}
          people={people}
          vehicles={vehicles}
          activity={activity}
        />
      </div>
    </Screen>
  );
}
