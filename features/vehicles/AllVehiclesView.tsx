"use client";

import { pluralize } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { GroupCard, GroupRow } from "@/components/ui/GroupCard";

import { VEHICLE_TYPE_LABEL } from "./vehicleTypeLabel";
import type { VehicleLeaderGroup } from "./queries";

export function AllVehiclesView({ groups }: { groups: VehicleLeaderGroup[] }) {
  if (groups.length === 0) {
    return (
      <EmptyState variant="blank" title="Todavía no hay dirigentes">
        Cargá un dirigente para empezar.
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-[9px]">
      {groups.map((group) => (
        <GroupCard
          key={group.leaderId}
          name={group.leaderName}
          summary={
            group.vehicles.length === 0
              ? "sin vehículos"
              : pluralize(group.vehicles.length, "vehículo", "vehículos")
          }
          isEmpty={group.vehicles.length === 0}
          emptyMessage="Este dirigente todavía no tiene vehículos."
        >
          {group.vehicles.map((vehicle) => (
            <GroupRow
              key={vehicle.id}
              title={vehicle.plate}
              meta={`${VEHICLE_TYPE_LABEL[vehicle.type]} · ${vehicle.driverFullName} · DNI ${vehicle.driverDni}${
                vehicle.driverPhone ? ` · ${vehicle.driverPhone}` : ""
              }`}
            />
          ))}
        </GroupCard>
      ))}
    </div>
  );
}
