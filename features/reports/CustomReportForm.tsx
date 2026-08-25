"use client";

import { Car, FileText, UserRound } from "lucide-react";
import { useMemo, useState } from "react";

type ReportType = "dirigente-punteros" | "dirigente-personas" | "puntero-personas" | "vehiculos";

type LeaderOption = { id: string; fullName: string };
type PointerOption = { id: string; fullName: string; leaderName: string };

const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  {
    value: "dirigente-punteros",
    label: "Dirigente y sus punteros",
    description: "Un dirigente con el listado de sus punteros.",
  },
  {
    value: "dirigente-personas",
    label: "Dirigente, punteros y personas",
    description: "Un dirigente con sus punteros y las personas que cargó cada uno.",
  },
  {
    value: "puntero-personas",
    label: "Puntero y sus personas",
    description: "Un puntero puntual con las personas que cargó.",
  },
  {
    value: "vehiculos",
    label: "Vehículos de un dirigente",
    description: "Los vehículos cargados por un dirigente.",
  },
];

function Autocomplete<T extends { id: string }>({
  query,
  onQueryChange,
  onSelect,
  options,
  renderOption,
  placeholder,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (option: T) => void;
  options: T[];
  renderOption: (option: T) => { title: string; subtitle?: string };
  placeholder: string;
}) {
  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return options
      .filter((option) => renderOption(option).title.toLowerCase().includes(normalized))
      .slice(0, 8);
  }, [query, options, renderOption]);

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
      />
      {matches.length > 0 ? (
        <div className="flex flex-col gap-1 rounded-lg border border-zinc-200 p-1">
          {matches.map((option) => {
            const { title, subtitle } = renderOption(option);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelect(option)}
                className="flex flex-col items-start rounded-md px-3 py-2 text-left hover:bg-zinc-100"
              >
                <span className="text-sm font-medium text-zinc-900">{title}</span>
                {subtitle ? <span className="text-xs text-zinc-500">{subtitle}</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function CustomReportForm({
  leaders,
  pointers,
}: {
  leaders: LeaderOption[];
  pointers: PointerOption[];
}) {
  const [reportType, setReportType] = useState<ReportType>("dirigente-punteros");

  const [leaderQuery, setLeaderQuery] = useState("");
  const [selectedLeader, setSelectedLeader] = useState<LeaderOption | null>(null);

  const [pointerQuery, setPointerQuery] = useState("");
  const [selectedPointer, setSelectedPointer] = useState<PointerOption | null>(null);

  function selectReportType(value: ReportType) {
    setReportType(value);
    setLeaderQuery("");
    setSelectedLeader(null);
    setPointerQuery("");
    setSelectedPointer(null);
  }

  const needsPointer = reportType === "puntero-personas";
  const isReady = needsPointer ? Boolean(selectedPointer) : Boolean(selectedLeader);

  const href = isReady
    ? needsPointer
      ? `/api/reportes/personalizado/pdf?type=${reportType}&pointerId=${selectedPointer!.id}`
      : `/api/reportes/personalizado/pdf?type=${reportType}&leaderId=${selectedLeader!.id}`
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {REPORT_TYPES.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
              reportType === option.value ? "border-zinc-900 bg-zinc-50" : "border-zinc-200"
            }`}
          >
            <input
              type="radio"
              name="reportType"
              checked={reportType === option.value}
              onChange={() => selectReportType(option.value)}
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="block text-sm font-medium text-zinc-900">{option.label}</span>
              <span className="block text-xs text-zinc-500">{option.description}</span>
            </span>
          </label>
        ))}
      </div>

      {needsPointer ? (
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-2 text-sm font-medium text-zinc-700">
            <UserRound className="h-4 w-4 text-zinc-500" aria-hidden="true" />
            Puntero
          </p>
          {selectedPointer ? (
            <div className="flex items-center justify-between rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-zinc-900">{selectedPointer.fullName}</p>
                <p className="text-xs text-zinc-500">Dirigente: {selectedPointer.leaderName}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPointer(null);
                  setPointerQuery("");
                }}
                className="text-xs font-medium text-zinc-600 underline underline-offset-2"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <Autocomplete
              query={pointerQuery}
              onQueryChange={setPointerQuery}
              onSelect={(option) => {
                setSelectedPointer(option);
                setPointerQuery(option.fullName);
              }}
              options={pointers}
              renderOption={(option) => ({ title: option.fullName, subtitle: `Dirigente: ${option.leaderName}` })}
              placeholder="Buscar puntero por nombre"
            />
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-2 text-sm font-medium text-zinc-700">
            {reportType === "vehiculos" ? (
              <Car className="h-4 w-4 text-zinc-500" aria-hidden="true" />
            ) : (
              <UserRound className="h-4 w-4 text-zinc-500" aria-hidden="true" />
            )}
            Dirigente
          </p>
          {selectedLeader ? (
            <div className="flex items-center justify-between rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2">
              <p className="text-sm font-medium text-zinc-900">{selectedLeader.fullName}</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedLeader(null);
                  setLeaderQuery("");
                }}
                className="text-xs font-medium text-zinc-600 underline underline-offset-2"
              >
                Cambiar
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
              renderOption={(option) => ({ title: option.fullName })}
              placeholder="Buscar dirigente por nombre"
            />
          )}
        </div>
      )}

      {href ? (
        <a
          href={href}
          className="flex h-12 items-center justify-center gap-2 rounded-lg bg-zinc-900 text-base font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          <FileText className="h-5 w-5" aria-hidden="true" />
          Generar PDF
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="flex h-12 items-center justify-center gap-2 rounded-lg bg-zinc-300 text-base font-semibold text-white"
        >
          <FileText className="h-5 w-5" aria-hidden="true" />
          Generar PDF
        </button>
      )}
    </div>
  );
}
