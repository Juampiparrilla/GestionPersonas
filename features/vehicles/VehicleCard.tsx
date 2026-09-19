"use client";

import { useState } from "react";

import { Chip } from "@/components/ui/Chip";
import { EntityRow } from "@/components/ui/EntityRow";

import { VehicleRowActions } from "./VehicleRowActions";
import { VEHICLE_TYPE_LABEL } from "./vehicleTypeLabel";
import type { VehicleListItem } from "./queries";

export function VehicleCard({
  vehicle,
  canWrite,
  isEditing,
  onStartEdit,
  onStopEdit,
}: {
  vehicle: VehicleListItem;
  canWrite: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <EntityRow
      name={vehicle.plate}
      avatarName={vehicle.driverFullName}
      meta={`${vehicle.driverFullName} · DNI ${vehicle.driverDni}`}
      chips={<Chip>{VEHICLE_TYPE_LABEL[vehicle.type]}</Chip>}
      expanded={expanded}
      onToggle={() => setExpanded((value) => !value)}
    >
      <VehicleRowActions
        vehicleId={vehicle.id}
        type={vehicle.type}
        plate={vehicle.plate}
        driverFullName={vehicle.driverFullName}
        driverDni={vehicle.driverDni}
        driverPhone={vehicle.driverPhone}
        canWrite={canWrite}
        isEditing={isEditing}
        onStartEdit={onStartEdit}
        onStopEdit={onStopEdit}
      />
    </EntityRow>
  );
}
