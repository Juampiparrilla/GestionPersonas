"use client";

import { useMemo, useState } from "react";

import { DataTable, type Column } from "./DataTable";

// Pantalla de escritorio de un listado: titulo con conteo, filtro de texto y
// la tabla. La altura ocupa lo que queda bajo la barra superior; la tabla
// scrollea por dentro y el pie con la paginacion queda fijo.
export function TablePage<T>({
  title,
  noun,
  rows,
  columns,
  getRowId,
  searchText,
  emptyMessage,
  filters,
}: {
  title: string;
  // "puntero" -> "2 punteros" (se agrega "s" para el plural).
  noun: string;
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  // Texto sobre el que filtra el buscador (nombre, DNI, patente...).
  searchText: (row: T) => string;
  emptyMessage: string;
  filters?: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!normalized) return rows;
    return rows.filter((row) => searchText(row).toLowerCase().includes(normalized));
  }, [rows, normalized, searchText]);

  return (
    <div className="flex h-[calc(100dvh-60px)] min-h-0 flex-col gap-4 p-6">
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">{title}</h1>
        <span className="text-[15px] text-ink-2">
          {rows.length} {rows.length === 1 ? noun : `${noun}s`}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {filters}
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filtrar la tabla"
          aria-label={`Filtrar ${title.toLowerCase()}`}
          className="ml-auto h-9 w-[260px] rounded-[10px] border border-line-input bg-surface px-3 text-sm text-ink placeholder:text-ink-ph focus:border-ink focus:outline-none"
        />
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        getRowId={getRowId}
        emptyMessage={rows.length === 0 ? emptyMessage : "No hay registros que coincidan con el filtro."}
      />
    </div>
  );
}
