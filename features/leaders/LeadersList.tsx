import type { LeaderListItem } from "./queries";
import { LeaderRowActions } from "./LeaderRowActions";

export function LeadersList({ leaders }: { leaders: LeaderListItem[] }) {
  if (leaders.length === 0) {
    return (
      <p className="rounded-xl border border-zinc-200 bg-white p-4 text-center text-zinc-600">
        Todavía no hay dirigentes cargados.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {leaders.map((leader, index) => (
        <div
          key={leader.id}
          className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4"
        >
          <div>
            <p className="font-medium text-zinc-900">
              {index + 1}. {leader.fullName}
            </p>
            <p className="text-sm text-zinc-600">
              DNI {leader.dni} · {leader.pointerCount} punteros
              {leader.phone ? ` · ${leader.phone}` : ""}
            </p>
          </div>
          <LeaderRowActions
            leaderId={leader.id}
            fullName={leader.fullName}
            phone={leader.phone}
            accessStatus={leader.accessStatus}
            pointerCount={leader.pointerCount}
          />
        </div>
      ))}
    </div>
  );
}
