"use client";

import { useState } from "react";

import { CountChip } from "@/components/ui/Chip";
import { EntityRow } from "@/components/ui/EntityRow";

import { PointerRowActions } from "./PointerRowActions";
import type { PointerListItem } from "./queries";

export function PointerCard({
  pointer,
  canWrite,
  isEditing,
  onStartEdit,
  onStopEdit,
}: {
  pointer: PointerListItem;
  canWrite: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <EntityRow
      name={pointer.fullName}
      meta={`DNI ${pointer.dni}${pointer.phone ? ` · ${pointer.phone}` : ""}`}
      chips={<CountChip count={pointer.peopleCount} singular="persona" plural="personas" />}
      expanded={expanded}
      onToggle={() => setExpanded((value) => !value)}
    >
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
    </EntityRow>
  );
}
