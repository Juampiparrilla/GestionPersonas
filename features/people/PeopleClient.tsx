"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { normalizeDni } from "@/utils/dni";

import { CollapsibleCreatePerson } from "./CollapsibleCreatePerson";
import { PeopleList } from "./PeopleList";
import type { PersonListItem } from "./queries";

export function PeopleClient({
  people,
  pointerId,
  canWrite,
}: {
  people: PersonListItem[];
  pointerId: string;
  canWrite: boolean;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [closeCreateSignal, setCloseCreateSignal] = useState<number>();
  const [openCreateSignal, setOpenCreateSignal] = useState<number>();

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

  function handleRequestCreate() {
    setOpenCreateSignal((value) => (value ?? 0) + 1);
  }

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
    <div className="flex flex-col gap-4">
      <CollapsibleCreatePerson
        pointerId={pointerId}
        canWrite={canWrite}
        onOpenChange={handleFormOpenChange}
        closeSignal={closeCreateSignal}
        openSignal={openCreateSignal}
      />

      {!formOpen && people.length > 0 ? (
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400">
            <Search className="h-4 w-4" aria-hidden="true" />
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

      <PeopleList
        people={formOpen ? people : filteredPeople}
        pointerId={pointerId}
        emptyMessage={
          normalizedQuery
            ? "No encontramos ninguna persona con ese nombre o DNI."
            : "Todavía no hay personas registradas en este puntero."
        }
        canWrite={canWrite}
        editingId={formOpen ? null : editingId}
        onStartEdit={handleStartEdit}
        onStopEdit={() => setEditingId(null)}
        onRequestCreate={handleRequestCreate}
      />
    </div>
  );
}
