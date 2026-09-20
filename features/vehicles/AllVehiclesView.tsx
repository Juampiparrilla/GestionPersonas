"use client";

import { EmptyCell, MonoCell, type Column } from "@/components/desktop/DataTable";
import { TablePage } from "@/components/desktop/TablePage";
import { pluralize } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { GroupCard, GroupRow } from "@/components/ui/GroupCard";
import { formatPhoneDisplay } from "@/utils/phone";

import { VEHICLE_TYPE_LABEL } from "./vehicleTypeLabel";
import type { VehicleLeaderGroup } from "./queries";

type Row = {
  id: string;
  plate: string;
  type: string;
  driver: string;
  driverDni: string;
  driverPhone: string | null;
  leaderName: string;
};

const COLUMNS: Column<Row>[] = [
  { key: "plate", header: "Patente", width: "1.1fr", render: (row) => <MonoCell>{row.plate}</MonoCell> },
  { key: "type", header: "Tipo", width: "1fr", render: (row) => <span className="text-ink-label">{row.type}</span> },
  {
    key: "driver",
    header: "Conductor",
    width: "1.8fr",
    render: (row) => <span className="truncate font-semibold text-ink">{row.driver}</span>,
  },
  { key: "dni", header: "DNI", width: "1.1fr", render: (row) => <MonoCell>{row.driverDni}</MonoCell> },
  {
    key: "phone",
    header: "Teléfono",
    width: "1.2fr",
    render: (row) =>
      row.driverPhone ? <MonoCell>{formatPhoneDisplay(row.driverPhone)}</MonoCell> : <EmptyCell />,
  },
  {
    key: "leader",
    header: "Dirigente",
    width: "1.6fr",
    render: (row) => <span className="truncate text-ink-label">{row.leaderName}</span>,
  },
];

export function AllVehiclesView({ groups }: { groups: VehicleLeaderGroup[] }) {
  if (groups.length === 0) {
    return (
      <EmptyState variant="blank" title="Todavía no hay dirigentes">
        Cargá un dirigente para empezar.
      </EmptyState>
    );
  }

  const rows: Row[] = groups.flatMap((group) =>
    group.vehicles.map((vehicle) => ({
      id: vehicle.id,
      plate: vehicle.plate,
      type: VEHICLE_TYPE_LABEL[vehicle.type],
      driver: vehicle.driverFullName,
      driverDni: vehicle.driverDni,
      driverPhone: vehicle.driverPhone,
      leaderName: group.leaderName,
    }))
  );

  return (
    <>
      <div className="hidden lg:block">
        <TablePage
          title="Vehículos"
          noun="vehículo"
          rows={rows}
          columns={COLUMNS}
          getRowId={(row) => row.id}
          searchText={(row) => `${row.plate} ${row.driver} ${row.driverDni} ${row.leaderName}`}
          emptyMessage="Todavía no hay vehículos cargados."
        />
      </div>

      <div className="flex flex-col gap-[9px] lg:hidden">
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
                  vehicle.driverPhone ? ` · ${formatPhoneDisplay(vehicle.driverPhone)}` : ""
                }`}
              />
            ))}
          </GroupCard>
        ))}
      </div>
    </>
  );
}
