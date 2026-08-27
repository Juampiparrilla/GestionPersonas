import { UserRoundPlus } from "lucide-react";

import { PersonCard } from "./PersonCard";
import type { PersonListItem } from "./queries";

export function PeopleList({
  people,
  pointerId,
  emptyMessage = "Todavía no hay personas registradas en este puntero.",
  canWrite,
  editingId,
  onStartEdit,
  onStopEdit,
  onRequestCreate,
}: {
  people: PersonListItem[];
  pointerId: string;
  emptyMessage?: string;
  canWrite: boolean;
  editingId: string | null;
  onStartEdit: (id: string) => void;
  onStopEdit: () => void;
  onRequestCreate?: () => void;
}) {
  if (people.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-white p-6 text-center">
        <p className="text-zinc-600">{emptyMessage}</p>
        {canWrite && onRequestCreate ? (
          <button
            type="button"
            onClick={onRequestCreate}
            className="flex h-11 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            <UserRoundPlus className="h-4 w-4" aria-hidden="true" />
            Agregar persona
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {people.map((person, index) => (
        <PersonCard
          key={person.id}
          person={person}
          index={index}
          pointerId={pointerId}
          canWrite={canWrite}
          isEditing={editingId === person.id}
          onStartEdit={() => onStartEdit(person.id)}
          onStopEdit={onStopEdit}
        />
      ))}
    </div>
  );
}
