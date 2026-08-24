"use client";

import { useState } from "react";

import { LeaderRowActions } from "./LeaderRowActions";
import type { LeaderListItem } from "./queries";

export function LeaderCard({
  leader,
  index,
  isEditing,
  onStartEdit,
  onStopEdit,
}: {
  leader: LeaderListItem;
  index: number;
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex items-center justify-between text-left"
      >
        <div>
          <p className="font-medium text-zinc-900">
            {index + 1}. {leader.fullName}
          </p>
          <p className="text-sm text-zinc-600">
            DNI {leader.dni} · {leader.pointerCount} punteros · {leader.personCount} personas ·{" "}
            {leader.vehicleCount} vehículos
            {leader.phone ? ` · ${leader.phone}` : ""}
          </p>
        </div>
        <span className="text-lg text-zinc-400">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded ? (
        <LeaderRowActions
          leaderId={leader.id}
          fullName={leader.fullName}
          phone={leader.phone}
          accessStatus={leader.accessStatus}
          pointerCount={leader.pointerCount}
          hasAccess={leader.hasAccess}
          accepted={leader.accepted}
          isEditing={isEditing}
          onStartEdit={onStartEdit}
          onStopEdit={onStopEdit}
        />
      ) : null}
    </div>
  );
}
