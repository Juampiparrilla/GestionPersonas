import { UserRoundPlus } from "lucide-react";

import { PointerCard } from "./PointerCard";
import type { PointerListItem } from "./queries";

export function PointersList({
  pointers,
  emptyMessage = "Todavía no hay punteros cargados.",
  canWrite,
  editingId,
  onStartEdit,
  onStopEdit,
  onRequestCreate,
}: {
  pointers: PointerListItem[];
  emptyMessage?: string;
  canWrite: boolean;
  editingId: string | null;
  onStartEdit: (id: string) => void;
  onStopEdit: () => void;
  onRequestCreate?: () => void;
}) {
  if (pointers.length === 0) {
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
            Agregar puntero
          </button>
        ) : null}
      </div>
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
