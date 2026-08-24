"use client";

import { useState } from "react";

import { LeaderCard } from "./LeaderCard";
import type { LeaderListItem } from "./queries";

export function LeadersList({
  leaders,
  emptyMessage = "Todavía no hay dirigentes cargados.",
}: {
  leaders: LeaderListItem[];
  emptyMessage?: string;
}) {
  // Solo un dirigente puede estar en edicion a la vez: se guarda ACA (en el
  // padre), no en cada fila, para que abrir uno cierre cualquier otro.
  const [editingId, setEditingId] = useState<string | null>(null);

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
          onStartEdit={() => setEditingId(leader.id)}
          onStopEdit={() => setEditingId(null)}
        />
      ))}
    </div>
  );
}
