"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

import { PointerRowActions } from "./PointerRowActions";
import type { PointerListItem } from "./queries";

export function PointerCard({
  pointer,
  index,
  canWrite,
  isEditing,
  onStartEdit,
  onStopEdit,
}: {
  pointer: PointerListItem;
  index: number;
  canWrite: boolean;
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
          <p className="font-bold text-zinc-900">
            {index + 1}. {pointer.fullName}
          </p>
          <p className="text-sm text-zinc-600">
            DNI {pointer.dni} · {pointer.peopleCount} personas
            {pointer.phone ? ` · ${pointer.phone}` : ""}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-zinc-400" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-zinc-400" aria-hidden="true" />
        )}
      </button>

      {expanded ? (
        <PointerRowActions
          pointerId={pointer.id}
          fullName={pointer.fullName}
          phone={pointer.phone}
          address={pointer.address}
          peopleCount={pointer.peopleCount}
          canWrite={canWrite}
          isEditing={isEditing}
          onStartEdit={onStartEdit}
          onStopEdit={onStopEdit}
        />
      ) : null}
    </div>
  );
}
