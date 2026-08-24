"use client";

import { useState } from "react";

import type { VehicleType } from "@/types/domain";

import { VehicleRowActions } from "./VehicleRowActions";
import type { VehicleListItem } from "./queries";

const VEHICLE_TYPE_LABEL: Record<VehicleType, string> = {
  auto: "🚗 Auto",
  moto: "🏍️ Moto",
  traffic: "🚐 Traffic",
  colectivo: "🚌 Colectivo",
};

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
        <span className="text-lg text-zinc-400">{expanded ? "▲" : "▼"}</span>
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
