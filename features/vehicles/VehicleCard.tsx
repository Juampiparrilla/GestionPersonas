"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

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
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex items-center justify-between text-left"
      >
        <div>
          <p className="font-medium text-zinc-900">{vehicle.plate}</p>
          <p className="text-sm text-zinc-600">
            {VEHICLE_TYPE_LABEL[vehicle.type]} · {vehicle.driverFullName} · DNI {vehicle.driverDni}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-zinc-400" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-zinc-400" aria-hidden="true" />
        )}
      </button>

      {expanded ? (
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
      ) : null}
    </div>
  );
}
