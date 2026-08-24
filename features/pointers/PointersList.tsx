import { PointerCard } from "./PointerCard";
import type { PointerListItem } from "./queries";

export function PointersList({
  pointers,
  emptyMessage = "Todavía no hay punteros cargados.",
  canWrite,
  editingId,
  onStartEdit,
  onStopEdit,
}: {
  pointers: PointerListItem[];
  emptyMessage?: string;
  canWrite: boolean;
  editingId: string | null;
  onStartEdit: (id: string) => void;
  onStopEdit: () => void;
}) {
  if (pointers.length === 0) {
    return (
      <p className="rounded-xl border border-zinc-200 bg-white p-4 text-center text-zinc-600">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {pointers.map((pointer, index) => (
        <PointerCard
          key={pointer.id}
          pointer={pointer}
          index={index}
          canWrite={canWrite}
          isEditing={editingId === pointer.id}
          onStartEdit={() => onStartEdit(pointer.id)}
          onStopEdit={onStopEdit}
        />
      ))}
    </div>
  );
}
