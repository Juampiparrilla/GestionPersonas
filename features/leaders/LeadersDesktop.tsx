"use client";

import { MoreHorizontal, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DataTable, EmptyCell, MonoCell, NumCell, type Column } from "@/components/desktop/DataTable";
import { useShellUrl } from "@/components/desktop/ShellContext";
import { Spinner } from "@/components/Spinner";
import { Avatar } from "@/components/ui/Avatar";
import { FilterChip } from "@/components/ui/Chip";
import { btnIcon, cardClass } from "@/components/ui/styles";
import { formatDayMonth } from "@/features/audit/dates";
import { normalizeDni } from "@/utils/dni";
import { formatPhoneDisplay } from "@/utils/phone";

import { loadLeaderDetailAction } from "./detailActions";
import type { LeaderDetailData } from "./detailTypes";
import { LeaderCounters, LeaderTabsAndActivity } from "./LeaderDetailClient";
import { LeaderRowActions } from "./LeaderRowActions";
import type { LeaderListItem } from "./queries";

type Filter = "all" | "withPointers" | "inactive";

const FILTER_LABEL: Record<Filter, string> = {
  all: "Todos",
  withPointers: "Con punteros",
  inactive: "Sin actividad",
};

const COLUMNS: Column<LeaderListItem>[] = [
  {
    key: "name",
    header: "Nombre",
    width: "2.1fr",
    render: (leader) => (
      <span className="flex min-w-0 items-center gap-3">
        <Avatar name={leader.fullName} size="sm" />
        <span className="truncate font-semibold text-ink">{leader.fullName}</span>
      </span>
    ),
  },
  { key: "dni", header: "DNI", width: "1.2fr", render: (leader) => <MonoCell>{leader.dni}</MonoCell> },
  {
    key: "phone",
    header: "Teléfono",
    width: "1.3fr",
    render: (leader) =>
      leader.phone ? <MonoCell>{formatPhoneDisplay(leader.phone)}</MonoCell> : <EmptyCell />,
  },
  { key: "pointers", header: "Punt.", width: "0.8fr", align: "right", render: (leader) => <NumCell value={leader.pointerCount} /> },
  { key: "people", header: "Pers.", width: "0.8fr", align: "right", render: (leader) => <NumCell value={leader.personCount} /> },
  { key: "vehicles", header: "Veh.", width: "0.8fr", align: "right", render: (leader) => <NumCell value={leader.vehicleCount} /> },
  {
    key: "createdAt",
    header: "Alta",
    width: "1fr",
    align: "right",
    render: (leader) =>
      leader.createdAt ? <MonoCell>{formatDayMonth(leader.createdAt)}</MonoCell> : <EmptyCell />,
  },
];

// Panel de detalle de 376px: es la ficha del dirigente (misma que la
// pantalla movil) comprimida a una columna. Se pide al elegir la fila.
function LeaderPanel({ leader, onClose }: { leader: LeaderListItem; onClose: () => void }) {
  const { openCarga, selectDetalle } = useShellUrl();
  const [loaded, setLoaded] = useState<{ id: string; data: LeaderDetailData | null } | null>(null);
  const [mode, setMode] = useState<"edit" | "actions" | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadLeaderDetailAction(leader.id).then((data) => {
      if (!cancelled) setLoaded({ id: leader.id, data });
    });
    return () => {
      cancelled = true;
    };
  }, [leader.id]);

  // El panel muestra lo ultimo pedido para ESTE dirigente (al cambiar de fila,
  // el anterior queda descartado hasta que llega el nuevo).
  const detail = loaded && loaded.id === leader.id ? loaded.data : null;
  const loading = !loaded || loaded.id !== leader.id;

  return (
    <aside className="flex h-full w-[376px] shrink-0 flex-col overflow-y-auto border-l border-line bg-bar">
      <div className="flex flex-col gap-3.5 border-b border-line p-5">
        <div className="flex items-start gap-3">
          <Avatar name={leader.fullName} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="text-[19px] font-semibold leading-tight tracking-[-0.015em] text-ink">
              {leader.fullName}
            </h2>
            <p className="mt-0.5 font-mono text-[13px] font-medium text-ink-2">
              {leader.dni}
              {leader.phone ? ` · ${formatPhoneDisplay(leader.phone)}` : ""}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar detalle" className={btnIcon}>
            <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openCarga("pointer", leader.id)}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-accent-press"
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Cargar bajo este
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === "edit" ? null : "edit")}
            aria-expanded={mode === "edit"}
            className="flex h-10 items-center rounded-xl border border-line-input bg-surface px-3.5 text-sm font-semibold text-ink-label hover:bg-muted"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === "actions" ? null : "actions")}
            aria-label="Más acciones"
            aria-expanded={mode === "actions"}
            className={`${btnIcon} !h-10 !w-10`}
          >
            <MoreHorizontal className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-5">
        {mode ? (
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
              isEditing={mode === "edit"}
              onStartEdit={() => setMode("edit")}
              onStopEdit={() => setMode(null)}
              onRemoved={() => selectDetalle(null)}
            />
          </section>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner className="h-7 w-7 text-accent" />
          </div>
        ) : detail ? (
          <>
            <LeaderCounters
              pointers={detail.pointers.length}
              people={detail.people.length}
              vehicles={detail.vehicles.length}
            />
            <LeaderTabsAndActivity
              key={leader.id}
              leaderId={leader.id}
              pointers={detail.pointers}
              people={detail.people}
              vehicles={detail.vehicles}
              activity={detail.activity}
              onAdd={(operation) =>
                openCarga(operation as "pointer" | "person" | "vehicle", leader.id)
              }
            />
          </>
        ) : (
          <p className="text-sm text-ink-2">No pudimos cargar el detalle de este dirigente.</p>
        )}
      </div>
    </aside>
  );
}

// Dirigentes en escritorio: tabla + panel de detalle a la derecha (estado en
// la URL: ?detalle=<id>).
export function LeadersDesktop({ leaders }: { leaders: LeaderListItem[] }) {
  const { detalleId, selectDetalle } = useShellUrl();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const normalizedDni = normalizeDni(query);

  const filtered = useMemo(() => {
    return leaders.filter((leader) => {
      if (filter === "withPointers" && leader.pointerCount === 0) return false;
      if (
        filter === "inactive" &&
        (leader.pointerCount > 0 || leader.personCount > 0 || leader.vehicleCount > 0)
      ) {
        return false;
      }
      if (!normalizedQuery) return true;
      return (
        leader.fullName.toLowerCase().includes(normalizedQuery) ||
        (normalizedDni.length > 0 && leader.dni.includes(normalizedDni))
      );
    });
  }, [leaders, filter, normalizedQuery, normalizedDni]);

  const selected = leaders.find((leader) => leader.id === detalleId) ?? null;

  return (
    <div className="flex h-[calc(100dvh-60px)] min-h-0">
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-6">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">Dirigentes</h1>
          <span className="text-[15px] text-ink-2">
            {leaders.length} {leaders.length === 1 ? "registro" : "registros"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(FILTER_LABEL) as Filter[]).map((key) => (
            <FilterChip key={key} active={filter === key} onClick={() => setFilter(key)}>
              {FILTER_LABEL[key]}
            </FilterChip>
          ))}
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filtrar por nombre o DNI"
            aria-label="Filtrar dirigentes"
            className="ml-auto h-9 w-[260px] rounded-[10px] border border-line-input bg-surface px-3 text-sm text-ink placeholder:text-ink-ph focus:border-ink focus:outline-none"
          />
        </div>

        <DataTable
          columns={COLUMNS}
          rows={filtered}
          getRowId={(leader) => leader.id}
          selectedId={selected?.id ?? null}
          onSelect={(leader) => selectDetalle(leader.id === detalleId ? null : leader.id)}
          emptyMessage={
            leaders.length === 0
              ? "Todavía no hay dirigentes. Cargá el primero con “Agregar dirigente”."
              : "No hay dirigentes que coincidan con el filtro."
          }
        />
      </div>

      {selected ? (
        <LeaderPanel key={selected.id} leader={selected} onClose={() => selectDetalle(null)} />
      ) : null}
    </div>
  );
}
