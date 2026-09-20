"use client";

import { useMemo, useState } from "react";

import { DataTable, type Column } from "./DataTable";
import { useShellUrl } from "./ShellContext";

// Listado de escritorio con panel de detalle a la derecha (376px). El panel
// se abre al elegir una fila y su estado vive en la URL (?detalle=<id>).
export function TableWithPanel<T>({
  title,
  noun,
  rows,
  columns,
  getRowId,
  searchText,
  emptyMessage,
  renderPanel,
}: {
  title: string;
  noun: string;
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  searchText: (row: T) => string;
  emptyMessage: string;
  renderPanel: (row: T, close: () => void) => React.ReactNode;
}) {
  const { detalleId, selectDetalle } = useShellUrl();
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!normalized) return rows;
    return rows.filter((row) => searchText(row).toLowerCase().includes(normalized));
  }, [rows, normalized, searchText]);

  const selected = rows.find((row) => getRowId(row) === detalleId) ?? null;

  return (
    <div className="flex h-[calc(100dvh-60px)] min-h-0">
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-6">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">{title}</h1>
          <span className="text-[15px] text-ink-2">
            {rows.length} {rows.length === 1 ? noun : `${noun}s`}
          </span>
        </div>

        <div className="flex items-center">
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
          selectedId={selected ? getRowId(selected) : null}
          onSelect={(row) => selectDetalle(getRowId(row) === detalleId ? null : getRowId(row))}
          emptyMessage={
            rows.length === 0 ? emptyMessage : "No hay registros que coincidan con el filtro."
          }
        />
      </div>

      {selected ? (
        <aside className="flex h-full w-[376px] shrink-0 flex-col overflow-y-auto border-l border-line bg-bar">
          {renderPanel(selected, () => selectDetalle(null))}
        </aside>
      ) : null}
    </div>
  );
}
