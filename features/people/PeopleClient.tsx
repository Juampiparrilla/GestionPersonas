"use client";

import { useMemo, useState } from "react";

import { ActionBar } from "@/components/ui/ActionBar";
import { CreateSheet } from "@/components/ui/CreateSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { SearchField } from "@/components/ui/SearchField";
import { normalizeDni } from "@/utils/dni";

import { CreatePersonForm } from "./CreatePersonForm";
import { PeopleList } from "./PeopleList";
import type { PersonListItem } from "./queries";

export function PeopleClient({
  people,
  pointerId,
  pointerName,
  pointerDni,
  canWrite,
  exportSlot,
}: {
  people: PersonListItem[];
  pointerId: string;
  pointerName: string;
  pointerDni: string;
  canWrite: boolean;
  exportSlot: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const normalizedDniQuery = normalizeDni(query);

  const filteredPeople = useMemo(() => {
    if (!normalizedQuery) return people;
    return people.filter((person) => {
      const nameMatch = person.fullName.toLowerCase().includes(normalizedQuery);
      const dniMatch = normalizedDniQuery.length > 0 && person.dni.includes(normalizedDniQuery);
      return nameMatch || dniMatch;
    });
  }, [people, normalizedQuery, normalizedDniQuery]);

  return (
    <Screen
      title={pointerName}
      subtitle={`DNI ${pointerDni} · ${people.length} ${people.length === 1 ? "persona" : "personas"}`}
      backHref="/dirigente/punteros"
      headerExtra={
        people.length > 0 ? (
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Nombre o DNI"
            label="Buscar personas"
          />
        ) : null
      }
      bar={
        <ActionBar>
          <div className="flex items-center gap-3">
            {exportSlot}
            <CreateSheet
              triggerLabel="Agregar persona"
              title="Agregar persona"
              canWrite={canWrite}
              successMessage="Persona agregada correctamente."
              renderForm={(onCreated) => (
                <CreatePersonForm pointerId={pointerId} onCreated={onCreated} />
              )}
            />
          </div>
        </ActionBar>
      }
    >
      <PeopleList
        people={filteredPeople}
        pointerId={pointerId}
        empty={
          normalizedQuery ? (
            <EmptyState variant="search" title={`Sin resultados para “${query.trim()}”`}>
              No encontramos ninguna persona con ese nombre o DNI.
            </EmptyState>
          ) : (
            <EmptyState variant="blank" title="Todavía no hay personas">
              Cargá la primera con el botón de abajo.
            </EmptyState>
          )
        }
        canWrite={canWrite}
        editingId={editingId}
        onStartEdit={setEditingId}
        onStopEdit={() => setEditingId(null)}
      />
    </Screen>
  );
}
