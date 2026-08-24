"use client";

import { useState } from "react";

import { PersonRowActions } from "./PersonRowActions";
import type { PersonListItem } from "./queries";

export function PersonCard({
  person,
  index,
  pointerId,
  canWrite,
  isEditing,
  onStartEdit,
  onStopEdit,
}: {
  person: PersonListItem;
  index: number;
  pointerId: string;
  canWrite: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const header = (
    <div>
      <p className="font-medium text-zinc-900">
        {index + 1}. {person.fullName}
      </p>
      <p className="text-sm text-zinc-600">
        DNI {person.dni}
        {person.phone ? ` · ${person.phone}` : ""}
      </p>
    </div>
  );

  if (!canWrite) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4">{header}</div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex items-center justify-between text-left"
      >
        {header}
        <span className="text-lg text-zinc-400">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded ? (
        <PersonRowActions
          personId={person.id}
          pointerId={pointerId}
          fullName={person.fullName}
          phone={person.phone}
          canWrite={canWrite}
          isEditing={isEditing}
          onStartEdit={onStartEdit}
          onStopEdit={onStopEdit}
        />
      ) : null}
    </div>
  );
}
