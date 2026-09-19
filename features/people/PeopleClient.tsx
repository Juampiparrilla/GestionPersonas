"use client";

import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ActionBar } from "@/components/ui/ActionBar";
import { Avatar } from "@/components/ui/Avatar";
import { CreateSheet } from "@/components/ui/CreateSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { ENTITY_ICON } from "@/components/ui/entityIcons";
import { Screen } from "@/components/ui/Screen";
import { SearchField } from "@/components/ui/SearchField";
import { btnIcon, cardClass } from "@/components/ui/styles";
import { PointerRowActions } from "@/features/pointers/PointerRowActions";
import { normalizeDni } from "@/utils/dni";
import { formatPhoneDisplay } from "@/utils/phone";

import { CreatePersonForm } from "./CreatePersonForm";
import { PeopleList } from "./PeopleList";
import type { PersonListItem } from "./queries";

export type PointerFicha = {
  id: string;
  fullName: string;
  dni: string;
  phone: string | null;
  address: string | null;
};

// Ficha de un puntero: sus datos, sus acciones (editar / quitar) y la lista
// de las personas que registro. "Editar" abre el formulario de edicion; "⋯"
// el resto de las acciones -- nunca las dos a la vez (igual que la ficha de
// un dirigente).
export function PeopleClient({
  people,
  pointer,
  canWrite,
  exportSlot,
}: {
  people: PersonListItem[];
  pointer: PointerFicha;
  canWrite: boolean;
  exportSlot: React.ReactNode;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [panel, setPanel] = useState<"edit" | "actions" | null>(null);

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
      backHref="/dirigente/punteros"
      headerRight={
        canWrite ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPanel(panel === "edit" ? null : "edit")}
              aria-expanded={panel === "edit"}
              className="flex h-9 items-center rounded-xl border border-line-input bg-surface px-[13px] text-[13px] font-semibold text-ink-label active:bg-muted"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => setPanel(panel === "actions" ? null : "actions")}
              aria-label="Más acciones"
              aria-expanded={panel === "actions"}
              className={`${btnIcon} !h-9 !w-9`}
            >
              <MoreHorizontal className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        ) : null
      }
      headerExtra={
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3.5">
            <Avatar name={pointer.fullName} size="lg" />
            <div className="min-w-0">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-ink-3">
                Puntero
              </p>
              <h1 className="text-[22px] font-semibold leading-[1.15] tracking-[-0.015em] text-ink">
                {pointer.fullName}
              </h1>
              <p className="font-mono text-[13px] font-medium text-ink-2">
                DNI {pointer.dni}
                {pointer.phone ? ` · ${formatPhoneDisplay(pointer.phone)}` : ""}
              </p>
            </div>
          </div>
          {people.length > 0 ? (
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Buscar persona por nombre o DNI"
              label="Buscar personas"
            />
          ) : null}
        </div>
      }
      bar={
        <ActionBar>
          <div className="flex items-center gap-3">
            {exportSlot}
            <CreateSheet
              icon={ENTITY_ICON.person}
              triggerLabel="Agregar persona"
              title="Agregar persona"
              canWrite={canWrite}
              successMessage="Persona agregada correctamente."
              renderForm={(onCreated) => (
                <CreatePersonForm pointerId={pointer.id} onCreated={onCreated} />
              )}
            />
          </div>
        </ActionBar>
      }
    >
      {panel ? (
        <section className={`${cardClass} p-3.5`}>
          <PointerRowActions
            pointerId={pointer.id}
            fullName={pointer.fullName}
            phone={pointer.phone}
            address={pointer.address}
            peopleCount={people.length}
            canWrite={canWrite}
            isEditing={panel === "edit"}
            onStartEdit={() => setPanel("edit")}
            onStopEdit={() => setPanel(null)}
            onRemoved={() => router.push("/dirigente/punteros")}
          />
        </section>
      ) : null}

      <PeopleList
        people={filteredPeople}
        pointerId={pointer.id}
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
