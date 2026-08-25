"use client";

import { useState } from "react";

import { VEHICLE_TYPE_LABEL } from "./VehicleCard";
import type { VehicleLeaderGroup } from "./queries";

function LeaderGroupCard({ group }: { group: VehicleLeaderGroup }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between text-left"
      >
        <p className="font-medium text-zinc-900">{group.leaderName}</p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-600">{group.vehicles.length} vehículos</span>
          <span className="text-lg text-zinc-400">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {expanded ? (
        group.vehicles.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">Este dirigente todavía no tiene vehículos.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {group.vehicles.map((vehicle, index) => (
              <div key={vehicle.id} className="rounded-lg border border-zinc-200 p-3">
                <p className="font-medium text-zinc-900">
                  {index + 1}. {vehicle.plate}
                </p>
                <p className="text-sm text-zinc-600">
                  {VEHICLE_TYPE_LABEL[vehicle.type]} · {vehicle.driverFullName} · DNI {vehicle.driverDni}
                  {vehicle.driverPhone ? ` · ${vehicle.driverPhone}` : ""}
                </p>
              </div>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}

export function AllVehiclesView({ groups }: { groups: VehicleLeaderGroup[] }) {
  if (groups.length === 0) {
    return (
      <p className="rounded-xl border border-zinc-200 bg-white p-4 text-center text-zinc-600">
        Todavía no hay dirigentes cargados.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => (
        <LeaderGroupCard key={group.leaderId} group={group} />
      ))}
    </div>
  );
}
