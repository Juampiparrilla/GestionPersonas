"use client";

import { useState } from "react";

import { EntityRow } from "@/components/ui/EntityRow";

import { PersonRowActions } from "./PersonRowActions";
import type { PersonListItem } from "./queries";

export function PersonCard({
  person,
  pointerId,
  canWrite,
  isEditing,
  onStartEdit,
  onStopEdit,
}: {
  person: PersonListItem;
  pointerId: string;
  canWrite: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = `DNI ${person.dni}${person.phone ? ` · ${person.phone}` : ""}`;

  // Sin permiso de escritura no hay acciones: la fila es solo lectura.
  if (!canWrite) {
    return <EntityRow name={person.fullName} meta={meta} />;
  }

  return (
    <EntityRow
      name={person.fullName}
      meta={meta}
      expanded={expanded}
      onToggle={() => setExpanded((value) => !value)}
    >
      <PersonRowActions
        personId={person.id}
        pointerId={pointerId}
        fullName={person.fullName}
        phone={person.phone}
        address={person.address}
        canWrite={canWrite}
        isEditing={isEditing}
        onStartEdit={onStartEdit}
        onStopEdit={onStopEdit}
      />
    </EntityRow>
  );
}
