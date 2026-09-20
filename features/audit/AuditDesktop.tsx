"use client";

import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable, MonoCell, type Column } from "@/components/desktop/DataTable";
import { FilterChip } from "@/components/ui/Chip";

import type { AuditLogRowView } from "./actions";
import { AUDIT_TIME_ZONE, formatDayMonth, type AuditRange } from "./dates";
import { CATEGORY_LABEL, type AuditCategory } from "./labels";

const CHIP_TONE: Record<AuditCategory, string> = {
  create: "border-ok-border bg-ok-bg text-ok-ink",
  remove: "border-err-border bg-err-bg text-err-ink",
  edit: "border-line bg-muted text-ink-label",
  restore: "border-line bg-muted text-ink-label",
  access: "border-line bg-muted text-ink-label",
  system: "border-line bg-muted text-ink-label",
};

function timeOf(row: AuditLogRowView, range: AuditRange): string {
  if (range === "today") {
    return new Date(row.createdAt).toLocaleTimeString("es-AR", {
      timeZone: AUDIT_TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  return formatDayMonth(row.createdAt);
}

function FilterSelect({
  label,
  allLabel,
  value,
  onChange,
  options,
}: {
  label: string;
  allLabel: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 appearance-none rounded-[10px] border border-line-input bg-surface pl-3 pr-8 text-sm font-medium text-ink-label hover:bg-muted focus:border-ink focus:outline-none"
      >
        <option value="">
          {label}: {allLabel}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {label}: {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-2"
        aria-hidden="true"
      />
    </label>
  );
}

// Auditoria en escritorio: tabla (Hora · Acción · Registro · Contexto ·
// Usuario · Origen). El rango (Hoy / 7 días / Todo) vuelve a pedir los datos;
// los desplegables filtran lo ya cargado.
export function AuditDesktop({
  rows,
  range,
  onRangeChange,
  pending,
}: {
  rows: AuditLogRowView[];
  range: AuditRange;
  onRangeChange: (range: AuditRange) => void;
  pending: boolean;
}) {
  const [user, setUser] = useState("");
  const [category, setCategory] = useState("");
  const [entity, setEntity] = useState("");

  const users = useMemo(
    () => Array.from(new Set(rows.map((row) => row.actorName).filter((name): name is string => Boolean(name)))).sort(),
    [rows]
  );
  const entities = useMemo(() => Array.from(new Set(rows.map((row) => row.entity))).sort(), [rows]);

  const filtered = rows.filter(
    (row) =>
      (!user || row.actorName === user) &&
      (!category || row.category === category) &&
      (!entity || row.entity === entity)
  );

  const columns: Column<AuditLogRowView>[] = [
    { key: "time", header: "Hora", width: "0.9fr", render: (row) => <MonoCell>{timeOf(row, range)}</MonoCell> },
    {
      key: "action",
      header: "Acción",
      width: "1.3fr",
      render: (row) => (
        <span
          className={`inline-block rounded-[7px] border px-[9px] py-[3px] text-[12px] font-semibold ${CHIP_TONE[row.category]}`}
        >
          {CATEGORY_LABEL[row.category]}
        </span>
      ),
    },
    {
      key: "subject",
      header: "Registro",
      width: "1.8fr",
      render: (row) => <span className="block truncate font-semibold text-ink">{row.subject}</span>,
    },
    {
      key: "context",
      header: "Contexto",
      width: "2.2fr",
      render: (row) => <span className="block truncate text-ink-label">{row.context}</span>,
    },
    {
      key: "user",
      header: "Usuario",
      width: "1.4fr",
      render: (row) => (
        <span className={`block truncate ${row.actorName ? "text-ink-label" : "text-ink-2"}`}>
          {row.actorName ?? "Sistema"}
        </span>
      ),
    },
    {
      key: "origin",
      header: "Origen",
      width: "1fr",
      render: (row) => <span className="font-mono text-[13px] font-medium text-ink-2">{row.origin ?? "—"}</span>,
    },
  ];

  return (
    <div className="flex h-[calc(100dvh-60px)] min-h-0 flex-col gap-4 p-6">
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">Auditoría</h1>
        <span className="text-[15px] text-ink-2">
          {rows.length} {rows.length === 1 ? "evento" : "eventos"}
          {range === "today" ? " hoy" : range === "week" ? " en los últimos 7 días" : ""}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip active={range === "today"} onClick={() => onRangeChange("today")}>
          Hoy
        </FilterChip>
        <FilterChip active={range === "week"} onClick={() => onRangeChange("week")}>
          7 días
        </FilterChip>
        <FilterChip active={range === "all"} onClick={() => onRangeChange("all")}>
          Todo
        </FilterChip>
        <span className="mx-1 h-6 border-l border-line-input" aria-hidden="true" />
        <FilterSelect
          label="Usuario"
          allLabel="todos"
          value={user}
          onChange={setUser}
          options={users.map((name) => ({ value: name, label: name }))}
        />
        <FilterSelect
          label="Acción"
          allLabel="todas"
          value={category}
          onChange={setCategory}
          options={(Object.keys(CATEGORY_LABEL) as AuditCategory[]).map((key) => ({
            value: key,
            label: CATEGORY_LABEL[key],
          }))}
        />
        <FilterSelect
          label="Entidad"
          allLabel="todas"
          value={entity}
          onChange={setEntity}
          options={entities.map((name) => ({ value: name, label: name }))}
        />
      </div>

      <div className={`flex min-h-0 flex-1 flex-col transition-opacity duration-150 ${pending ? "opacity-60" : ""}`}>
        <DataTable
          columns={columns}
          rows={filtered}
          getRowId={(row) => row.id}
          pageSize={20}
          emptyMessage="No hay actividad para estos filtros."
        />
      </div>
    </div>
  );
}
