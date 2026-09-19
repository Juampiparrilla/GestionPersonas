import { PersonCard } from "./PersonCard";
import type { PersonListItem } from "./queries";

export function PeopleList({
  people,
  pointerId,
  empty,
  canWrite,
  editingId,
  onStartEdit,
  onStopEdit,
}: {
  people: PersonListItem[];
  pointerId: string;
  empty: React.ReactNode;
  canWrite: boolean;
  editingId: string | null;
  onStartEdit: (id: string) => void;
  onStopEdit: () => void;
}) {
  if (people.length === 0) {
    return <>{empty}</>;
  }

  return (
    <div className="flex flex-col gap-[9px]">
      {people.map((person) => (
        <PersonCard
          key={person.id}
          person={person}
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
