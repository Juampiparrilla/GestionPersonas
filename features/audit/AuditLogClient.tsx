"use client";

import { SlidersHorizontal } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { Spinner } from "@/components/Spinner";
import { Avatar } from "@/components/ui/Avatar";
import { FilterChip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import {
  btnPrimary,
  btnSecondary,
  cardClass,
  inputClass,
  labelClass,
  linkActionClass,
} from "@/components/ui/styles";

import { fetchAuditLogsAction, type AuditLogRowView } from "./actions";
import { AUDIT_TIME_ZONE, rangeDates, type AuditRange } from "./dates";
import { ACTION_FILTER_LABEL, AUDIT_ACTIONS } from "./labels";
import type { AuditLogFilters } from "./queries";

type Option = { id: string; fullName: string };
type Range = AuditRange;

function formatTime(iso: string, range: Range): string {
  const date = new Date(iso);
  if (range === "today") {
    return date.toLocaleTimeString("es-AR", {
      timeZone: AUDIT_TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  return date.toLocaleDateString("es-AR", {
    timeZone: AUDIT_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
  });
}

function Autocomplete({
  query,
  onQueryChange,
  onSelect,
  options,
  placeholder,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (option: Option) => void;
  options: Option[];
  placeholder: string;
}) {
  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return options.filter((option) => option.fullName.toLowerCase().includes(normalized)).slice(0, 8);
  }, [query, options]);

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
      {matches.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          {matches.map((option, index) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option)}
              className={`flex min-h-[48px] w-full items-center gap-3 px-3.5 py-2 text-left text-[15px] font-semibold text-ink active:bg-muted ${
                index > 0 ? "border-t border-line-inner" : ""
              }`}
            >
              <Avatar name={option.fullName} size="sm" />
              {option.fullName}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SelectedOption({ name, onClear }: { name: string; onClear: () => void }) {
  return (
    <div className="flex h-[54px] items-center justify-between rounded-[14px] border border-line-input bg-surface px-4">
      <span className="truncate text-base text-ink">{name}</span>
      <button type="button" onClick={onClear} className={`${linkActionClass} min-h-[44px] px-1`}>
        Quitar
      </button>
    </div>
  );
}

export function AuditLogClient({
  initialRows,
  leaders,
  organizations,
  backHref,
  initialRange = "today",
}: {
  initialRows: AuditLogRowView[];
  leaders?: Option[];
  organizations?: Option[];
  backHref: string;
  // Rango con el que el servidor ya trajo `initialRows`.
  initialRange?: AuditRange;
}) {
  const [rows, setRows] = useState(initialRows);
  const [isPending, startTransition] = useTransition();

  const [range, setRange] = useState<Range>(initialRange);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [action, setAction] = useState("");

  const [leaderQuery, setLeaderQuery] = useState("");
  const [selectedLeader, setSelectedLeader] = useState<Option | null>(null);

  const [orgQuery, setOrgQuery] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<Option | null>(null);

  function fetchRows(next: {
    range: Range;
    action: string;
    leader: Option | null;
    org: Option | null;
  }) {
    const filters: AuditLogFilters = {
      ...rangeDates(next.range),
      action: next.action || undefined,
      leaderId: next.leader?.id,
      organizationId: next.org?.id,
    };
    startTransition(async () => {
      const result = await fetchAuditLogsAction(filters);
      setRows(result);
    });
  }

  function changeRange(next: Range) {
    setRange(next);
    fetchRows({ range: next, action, leader: selectedLeader, org: selectedOrg });
  }

  function applyFilters() {
    fetchRows({ range, action, leader: selectedLeader, org: selectedOrg });
  }

  function clearFilters() {
    setAction("");
    setSelectedLeader(null);
    setLeaderQuery("");
    setSelectedOrg(null);
    setOrgQuery("");
    fetchRows({ range, action: "", leader: null, org: null });
  }

  const hasFilters = Boolean(action || selectedLeader || selectedOrg);

  return (
    <Screen
      title="Auditoría"
      backHref={backHref}
      headerExtra={
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip active={range === "today"} onClick={() => changeRange("today")}>
            Hoy
          </FilterChip>
          <FilterChip active={range === "week"} onClick={() => changeRange("week")}>
            7 días
          </FilterChip>
          <FilterChip active={range === "all"} onClick={() => changeRange("all")}>
            Todo
          </FilterChip>
          <button
            type="button"
            onClick={() => setFiltersOpen((value) => !value)}
            aria-expanded={filtersOpen}
            className={`ml-auto flex min-h-[44px] items-center gap-1.5 rounded-[9px] border px-3 text-[13px] font-medium ${
              hasFilters || filtersOpen
                ? "border-ink text-ink"
                : "border-line-input bg-surface text-ink-label"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            Filtros
          </button>
        </div>
      }
    >
      {filtersOpen ? (
        <section className={`${cardClass} flex flex-col gap-3.5 p-4`}>
          {organizations ? (
            <div className="flex flex-col gap-1.5">
              <p className={labelClass}>Organización</p>
              {selectedOrg ? (
                <SelectedOption
                  name={selectedOrg.fullName}
                  onClear={() => {
                    setSelectedOrg(null);
                    setOrgQuery("");
                  }}
                />
              ) : (
                <Autocomplete
                  query={orgQuery}
                  onQueryChange={setOrgQuery}
                  onSelect={(option) => {
                    setSelectedOrg(option);
                    setOrgQuery(option.fullName);
                  }}
                  options={organizations}
                  placeholder="Todas las organizaciones"
                />
              )}
            </div>
          ) : null}

          {leaders ? (
            <div className="flex flex-col gap-1.5">
              <p className={labelClass}>Dirigente</p>
              {selectedLeader ? (
                <SelectedOption
                  name={selectedLeader.fullName}
                  onClear={() => {
                    setSelectedLeader(null);
                    setLeaderQuery("");
                  }}
                />
              ) : (
                <Autocomplete
                  query={leaderQuery}
                  onQueryChange={setLeaderQuery}
                  onSelect={(option) => {
                    setSelectedLeader(option);
                    setLeaderQuery(option.fullName);
                  }}
                  options={leaders}
                  placeholder="Todos los dirigentes"
                />
              )}
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="audit-action" className={labelClass}>
              Acción
            </label>
            <select
              id="audit-action"
              value={action}
              onChange={(event) => setAction(event.target.value)}
              className={inputClass}
            >
              <option value="">Todas</option>
              {AUDIT_ACTIONS.map((value) => (
                <option key={value} value={value}>
                  {ACTION_FILTER_LABEL[value] ?? value}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2.5">
            <button type="button" onClick={clearFilters} disabled={isPending} className={btnSecondary}>
              Limpiar
            </button>
            <button type="button" onClick={applyFilters} disabled={isPending} className={btnPrimary}>
              {isPending ? <Spinner className="h-4 w-4" /> : null}
              Filtrar
            </button>
          </div>
        </section>
      ) : null}

      <div
        className={`flex flex-col gap-2.5 transition-opacity duration-150 ${isPending ? "opacity-60" : ""}`}
        aria-busy={isPending}
      >
        {rows.length === 0 ? (
          <EmptyState variant="search" title="Sin actividad">
            No hay actividad para estos filtros.
          </EmptyState>
        ) : (
          rows.map((row) => (
            <div key={row.id} className={`${cardClass} flex gap-3 rounded-2xl p-3.5`}>
              <span className="w-[44px] shrink-0 pt-0.5 font-mono text-[12px] font-medium text-ink-3">
                {formatTime(row.createdAt, range)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-ink">
                  {ACTION_FILTER_LABEL[row.action] ?? row.action}
                </p>
                <p className="text-[13px] text-ink-2">{row.description}</p>
                {row.organizationName || row.ipAddress ? (
                  <p className="mt-0.5 text-[12px] text-ink-3">
                    {[row.organizationName, row.ipAddress].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </Screen>
  );
}
