import { PersonCard } from "./PersonCard";
import type { PersonListItem } from "./queries";

export function PeopleList({
  people,
  pointerId,
  emptyMessage = "Todavía no hay personas registradas en este puntero. Cargá la primera con el botón de arriba.",
  canWrite,
  editingId,
  onStartEdit,
  onStopEdit,
}: {
  people: PersonListItem[];
  pointerId: string;
  emptyMessage?: string;
  canWrite: boolean;
  editingId: string | null;
  onStartEdit: (id: string) => void;
  onStopEdit: () => void;
}) {
  if (people.length === 0) {
    return (
      <p className="rounded-xl border border-zinc-200 bg-white p-4 text-center text-zinc-600">
        {emptyMessage}
      </p>
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
