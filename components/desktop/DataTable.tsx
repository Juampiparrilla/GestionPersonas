"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export type Column<T> = {
  key: string;
  header: string;
  // Peso de la columna en la grilla (fr): "2.1fr".
  width: string;
  align?: "right";
  render: (row: T) => React.ReactNode;
};

// Numero en mono; un cero se pinta en gris claro para que el ojo encuentre
// de un barrido los registros sin actividad.
export function NumCell({ value }: { value: number }) {
  return (
    <span className={`font-mono text-sm font-medium ${value === 0 ? "text-[#a3a3a8]" : "text-ink"}`}>
      {value}
    </span>
  );
}

export function MonoCell({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-sm font-medium text-ink">{children}</span>;
}

export function EmptyCell() {
  return <span className="text-ink-ph">—</span>;
}

// Tabla de escritorio: cabecera en mono, filas de 13px de relleno, fila
// seleccionada con barra de acento, pie con "Mostrando N de M" y paginacion.
// Navegacion por teclado: flechas para moverse entre filas y Enter para
// abrirla (sin esto la densidad no rinde). Por debajo de ~1280px la tabla
// scrollea en horizontal.
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  selectedId,
  onSelect,
  pageSize = 15,
  emptyMessage = "No hay registros para mostrar.",
}: {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  selectedId?: string | null;
  onSelect?: (row: T) => void;
  pageSize?: number;
  emptyMessage?: string;
}) {
  const [page, setPage] = useState(0);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  // Si el filtro achico la lista, la pagina actual puede quedar fuera de rango.
  const safePage = Math.min(page, pageCount - 1);
  const visible = rows.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const template = columns.map((column) => column.width).join(" ");

  function onRowKeyDown(event: React.KeyboardEvent<HTMLDivElement>, row: T) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect?.(row);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const sibling =
        event.key === "ArrowDown"
          ? event.currentTarget.nextElementSibling
          : event.currentTarget.previousElementSibling;
      if (sibling instanceof HTMLElement && sibling.dataset.row) sibling.focus();
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-line bg-surface">
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="min-w-[760px]">
          <div
            className="grid gap-4 border-b border-line bg-table-head px-[18px] py-[11px]"
            style={{ gridTemplateColumns: template }}
            role="row"
          >
            {columns.map((column) => (
              <span
                key={column.key}
                role="columnheader"
                className={`font-mono text-[11px] font-medium uppercase tracking-[0.09em] text-ink-3 ${
                  column.align === "right" ? "text-right" : ""
                }`}
              >
                {column.header}
              </span>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="px-[18px] py-10 text-center text-sm text-ink-2">{emptyMessage}</p>
          ) : (
            visible.map((row) => {
              const id = getRowId(row);
              const selected = selectedId === id;
              return (
                <div
                  key={id}
                  role="row"
                  data-row="true"
                  tabIndex={onSelect ? 0 : undefined}
                  aria-selected={onSelect ? selected : undefined}
                  onClick={() => onSelect?.(row)}
                  onKeyDown={(event) => onRowKeyDown(event, row)}
                  className={`grid items-center gap-4 border-b border-line-row px-[18px] py-[13px] text-sm last:border-b-0 ${
                    onSelect ? "cursor-pointer" : ""
                  } ${
                    selected
                      ? "border-l-[3px] border-l-accent bg-row-selected pl-[15px]"
                      : onSelect
                        ? "hover:bg-app"
                        : ""
                  }`}
                  style={{ gridTemplateColumns: template }}
                >
                  {columns.map((column) => (
                    <div
                      key={column.key}
                      role="cell"
                      className={`min-w-0 ${column.align === "right" ? "text-right" : ""}`}
                    >
                      {column.render(row)}
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-line bg-table-head px-[18px] py-2.5">
        <span className="text-[13px] text-ink-2">
          Mostrando {visible.length} de {rows.length}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage(Math.max(0, safePage - 1))}
            disabled={safePage === 0}
            aria-label="Página anterior"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-line-input bg-surface text-ink-label hover:bg-muted disabled:text-[#a3a3a8] disabled:hover:bg-surface"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
            disabled={safePage >= pageCount - 1}
            aria-label="Página siguiente"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-line-input bg-surface text-ink-label hover:bg-muted disabled:text-[#a3a3a8] disabled:hover:bg-surface"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
