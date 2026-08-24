"use client";

import { useState } from "react";

import { LeaderRowActions } from "./LeaderRowActions";
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
            hasAccess={leader.hasAccess}
            accepted={leader.accepted}
            isEditing={editingId === leader.id}
            onStartEdit={() => setEditingId(leader.id)}
            onStopEdit={() => setEditingId(null)}
          />
        </div>
      ))}
    </div>
  );
}
