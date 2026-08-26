"use client";

import { useMemo, useState, useTransition } from "react";

import { Spinner } from "@/components/Spinner";

import { fetchAuditLogsAction, type AuditLogRowView } from "./actions";
import { AUDIT_ACTIONS } from "./labels";
import type { AuditLogFilters } from "./queries";

type Option = { id: string; fullName: string };

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
    <div className="flex flex-col gap-1">
      <input
        type="text"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
      />
      {matches.length > 0 ? (
        <div className="flex flex-col gap-1 rounded-lg border border-zinc-200 p-1">
          {matches.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option)}
              className="rounded-md px-3 py-1.5 text-left text-sm text-zinc-900 hover:bg-zinc-100"
            >
              {option.fullName}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const inputClassName =
  "h-10 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none";

export function AuditLogClient({
  initialRows,
  leaders,
  organizations,
}: {
  initialRows: AuditLogRowView[];
  leaders?: Option[];
  organizations?: Option[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [isPending, startTransition] = useTransition();

  const [action, setAction] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [leaderQuery, setLeaderQuery] = useState("");
  const [selectedLeader, setSelectedLeader] = useState<Option | null>(null);

  const [orgQuery, setOrgQuery] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<Option | null>(null);

  function applyFilters(overrides: Partial<AuditLogFilters> = {}) {
    const filters: AuditLogFilters = {
      action: action || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      leaderId: selectedLeader?.id,
      organizationId: selectedOrg?.id,
      ...overrides,
    };
    startTransition(async () => {
      const result = await fetchAuditLogsAction(filters);
      setRows(result);
    });
  }

  function clearFilters() {
    setAction("");
    setDateFrom("");
    setDateTo("");
    setSelectedLeader(null);
    setLeaderQuery("");
    setSelectedOrg(null);
    setOrgQuery("");
    startTransition(async () => {
      const result = await fetchAuditLogsAction({});
      setRows(result);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 rounded-xl border-2 border-zinc-300 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        {organizations ? (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">Organización</label>
            {selectedOrg ? (
              <div className="flex h-10 items-center justify-between rounded-lg border border-zinc-300 bg-zinc-50 px-3">
                <span className="truncate text-sm text-zinc-900">{selectedOrg.fullName}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrg(null);
                    setOrgQuery("");
                  }}
                  className="text-xs font-medium text-zinc-600 underline underline-offset-2"
                >
                  Quitar
                </button>
              </div>
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
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">Dirigente</label>
            {selectedLeader ? (
              <div className="flex h-10 items-center justify-between rounded-lg border border-zinc-300 bg-zinc-50 px-3">
                <span className="truncate text-sm text-zinc-900">{selectedLeader.fullName}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLeader(null);
                    setLeaderQuery("");
                  }}
                  className="text-xs font-medium text-zinc-600 underline underline-offset-2"
                >
                  Quitar
                </button>
              </div>
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

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Acción</label>
          <select value={action} onChange={(event) => setAction(event.target.value)} className={inputClassName}>
            <option value="">Todas</option>
            {AUDIT_ACTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Desde / hasta</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className={inputClassName}
            />
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className={inputClassName}
            />
          </div>
        </div>

        <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
          <button
            type="button"
            onClick={() => applyFilters()}
            disabled={isPending}
            className="flex h-10 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-60"
          >
            {isPending ? <Spinner className="h-4 w-4" /> : null}
            Filtrar
          </button>
          <button
            type="button"
            onClick={clearFilters}
            disabled={isPending}
            className="flex h-10 items-center rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 disabled:opacity-60"
          >
            Limpiar
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {rows.length === 0 ? (
          <p className="rounded-xl border-2 border-zinc-200 bg-white p-4 text-sm text-zinc-500">
            No hay actividad para estos filtros.
          </p>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="rounded-xl border-2 border-zinc-200 bg-white p-3">
              <p className="text-sm text-zinc-900">{row.description}</p>
              <p className="mt-1 text-xs text-zinc-400">
                {new Date(row.createdAt).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}
                {row.organizationName ? ` · ${row.organizationName}` : ""}
                {row.ipAddress ? ` · ${row.ipAddress}` : ""}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
