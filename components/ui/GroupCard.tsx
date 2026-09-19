"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";

import { Avatar } from "./Avatar";
import { rowCardClass } from "./styles";

// Tarjeta expandible de un dirigente (vistas de solo lectura del
// Administrador de Organización): avatar + nombre + resumen, y al expandir
// las filas de lo que tiene cargado.
export function GroupCard({
  name,
  summary,
  emptyMessage,
  children,
  isEmpty,
}: {
  name: string;
  summary: string;
  emptyMessage: string;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={rowCardClass}>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 p-3.5 text-left"
      >
        <Avatar name={name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-ink">{name}</p>
          <p className="text-[13px] text-ink-2">{summary}</p>
        </div>
        <ChevronRight
          className={`h-4 w-4 shrink-0 text-ink-ph transition-transform duration-200 ease-out ${expanded ? "rotate-90" : ""}`}
          aria-hidden="true"
        />
      </button>

      {expanded ? (
        <div className="flex flex-col gap-2 border-t border-line-inner p-3.5">
          {isEmpty ? <p className="text-sm text-ink-2">{emptyMessage}</p> : children}
        </div>
      ) : null}
    </div>
  );
}

// Fila interna (puntero / persona / vehiculo dentro de un grupo).
export function GroupRow({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="rounded-xl bg-muted px-3 py-2.5">
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      <p className="font-mono text-[12px] font-medium text-ink-2">{meta}</p>
    </div>
  );
}
