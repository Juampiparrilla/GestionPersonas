import { PointerCard } from "./PointerCard";
import type { PointerListItem } from "./queries";

export function PointersList({
  pointers,
  empty,
  canWrite,
  editingId,
  onStartEdit,
  onStopEdit,
}: {
  pointers: PointerListItem[];
  empty: React.ReactNode;
  canWrite: boolean;
  editingId: string | null;
  onStartEdit: (id: string) => void;
  onStopEdit: () => void;
}) {
  if (pointers.length === 0) {
    return <>{empty}</>;
  }

  return (
    <div className="flex flex-col gap-[9px]">
      {pointers.map((pointer) => (
        <PointerCard
          key={pointer.id}
          pointer={pointer}
          canWrite={canWrite}
          isEditing={editingId === pointer.id}
          onStartEdit={() => onStartEdit(pointer.id)}
          onStopEdit={onStopEdit}
        />
      ))}
    </div>
  );
}
