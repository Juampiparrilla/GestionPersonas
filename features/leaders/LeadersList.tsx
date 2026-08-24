import { LeaderCard } from "./LeaderCard";
import type { LeaderListItem } from "./queries";

export function LeadersList({
  leaders,
  emptyMessage = "Todavía no hay dirigentes cargados.",
  editingId,
  onStartEdit,
  onStopEdit,
}: {
  leaders: LeaderListItem[];
  emptyMessage?: string;
  editingId: string | null;
  onStartEdit: (id: string) => void;
  onStopEdit: () => void;
}) {
  if (leaders.length === 0) {
    return (
      <p className="rounded-xl border border-zinc-200 bg-white p-4 text-center text-zinc-600">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {leaders.map((leader, index) => (
        <LeaderCard
          key={leader.id}
          leader={leader}
          index={index}
          isEditing={editingId === leader.id}
          onStartEdit={() => onStartEdit(leader.id)}
          onStopEdit={onStopEdit}
        />
      ))}
    </div>
  );
}
