"use client";

import { useMemo, useState } from "react";

import { ActionBar } from "@/components/ui/ActionBar";
import { CreateSheet } from "@/components/ui/CreateSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { ENTITY_ICON } from "@/components/ui/entityIcons";
import { Screen } from "@/components/ui/Screen";
import { SearchField } from "@/components/ui/SearchField";
import { normalizeDni } from "@/utils/dni";

import { CreatePointerForm } from "./CreatePointerForm";
import { PointersList } from "./PointersList";
import type { PointerListItem } from "./queries";

export function PointersClient({
  pointers,
  canWrite,
  exportSlot,
}: {
  pointers: PointerListItem[];
  canWrite: boolean;
  exportSlot: React.ReactNode;
}) {
  const [query, setQuery] = useState("");

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
    <Screen
      title="Mis Punteros"
      backHref="/dirigente"
      headerRight={<span className="font-mono text-[13px] font-medium text-ink-2">{pointers.length}</span>}
      headerExtra={
        pointers.length > 0 ? (
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Nombre o DNI"
            label="Buscar punteros"
          />
        ) : null
      }
      bar={
        <ActionBar>
          <div className="flex items-center gap-3">
            {exportSlot}
            <CreateSheet
              icon={ENTITY_ICON.pointer}
              triggerLabel="Agregar puntero"
              title="Agregar puntero"
              canWrite={canWrite}
              lockedMessage="La carga está cerrada en este momento. Podés consultar tus punteros, pero no agregar ni modificar nada."
              successMessage="El puntero fue creado exitosamente."
              renderForm={(onCreated) => <CreatePointerForm onCreated={onCreated} />}
            />
          </div>
        </ActionBar>
      }
    >
      <PointersList
        pointers={filteredPointers}
        empty={
          normalizedQuery ? (
            <EmptyState variant="search" title={`Sin resultados para “${query.trim()}”`}>
              No encontramos ningún puntero con ese nombre o DNI.
            </EmptyState>
          ) : (
            <EmptyState variant="blank" title="Todavía no hay punteros">
              Cargá el primero con el botón de abajo.
            </EmptyState>
          )
        }
      />
    </Screen>
  );
}
