"use client";

import { useMemo, useState } from "react";

import { normalizeDni } from "@/utils/dni";

import { CollapsibleCreatePointer } from "./CollapsibleCreatePointer";
import { PointersList } from "./PointersList";
import type { PointerListItem } from "./queries";

export function PointersClient({
  pointers,
  canWrite,
}: {
  pointers: PointerListItem[];
  canWrite: boolean;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [closeCreateSignal, setCloseCreateSignal] = useState<number>();

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open);
    if (open) {
      setEditingId(null);
    }
  }

  function handleStartEdit(id: string) {
    setEditingId(id);
    setCloseCreateSignal((value) => (value ?? 0) + 1);
  }

  const normalizedQuery = query.trim().toLowerCase();
  const normalizedDniQuery = normalizeDni(query);

  const filteredPointers = useMemo(() => {
    if (!normalizedQuery) return pointers;
    return pointers.filter((pointer) => {
      const nameMatch = pointer.fullName.toLowerCase().includes(normalizedQuery);
      const dniMatch = normalizedDniQuery.length > 0 && pointer.dni.includes(normalizedDniQuery);
      return nameMatch || dniMatch;
    });
  }, [pointers, normalizedQuery, normalizedDniQuery]);

  return (
    <div className="flex flex-col gap-4">
      <CollapsibleCreatePointer
        canWrite={canWrite}
        onOpenChange={handleFormOpenChange}
        closeSignal={closeCreateSignal}
      />

      {!formOpen ? (
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400">
            🔎
          </span>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre o DNI"
            className="h-12 w-full rounded-lg border border-zinc-300 pl-10 pr-4 text-base text-zinc-900 focus:border-zinc-500 focus:outline-none"
          />
        </div>
      ) : null}

      <PointersList
        pointers={formOpen ? pointers : filteredPointers}
        emptyMessage={
          normalizedQuery
            ? "No encontramos ningún puntero con ese nombre o DNI."
            : "Todavía no hay punteros cargados."
        }
        canWrite={canWrite}
        editingId={formOpen ? null : editingId}
        onStartEdit={handleStartEdit}
        onStopEdit={() => setEditingId(null)}
      />
    </div>
  );
}
