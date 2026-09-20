"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { EmptyCell, MonoCell, type Column } from "@/components/desktop/DataTable";
import { TableWithPanel } from "@/components/desktop/TableWithPanel";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { btnIcon, cardClass } from "@/components/ui/styles";
import { formatPhoneDisplay } from "@/utils/phone";

import { VehicleRowActions } from "./VehicleRowActions";
import { VEHICLE_TYPE_LABEL } from "./vehicleTypeLabel";
import type { VehicleListItem } from "./queries";

const COLUMNS: Column<VehicleListItem>[] = [
  { key: "plate", header: "Patente", width: "1.1fr", render: (vehicle) => <MonoCell>{vehicle.plate}</MonoCell> },
  {
    key: "type",
    header: "Tipo",
    width: "1fr",
    render: (vehicle) => <span className="text-ink-label">{VEHICLE_TYPE_LABEL[vehicle.type]}</span>,
  },
  {
    key: "driver",
    header: "Conductor",
    width: "2fr",
    render: (vehicle) => (
      <span className="flex min-w-0 items-center gap-3">
        <Avatar name={vehicle.driverFullName} size="sm" tone="muted" />
        <span className="truncate font-semibold text-ink">{vehicle.driverFullName}</span>
      </span>
    ),
  },
  { key: "dni", header: "DNI", width: "1.1fr", render: (vehicle) => <MonoCell>{vehicle.driverDni}</MonoCell> },
  {
    key: "phone",
    header: "Teléfono",
    width: "1.2fr",
    render: (vehicle) =>
      vehicle.driverPhone ? <MonoCell>{formatPhoneDisplay(vehicle.driverPhone)}</MonoCell> : <EmptyCell />,
  },
];

function VehiclePanel({
  vehicle,
  canWrite,
  onClose,
}: {
  vehicle: VehicleListItem;
  canWrite: boolean;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <div className="flex items-start gap-3 border-b border-line p-5">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-ink-3">
            Vehículo
          </p>
          <h2 className="font-mono text-[22px] font-semibold leading-tight text-ink">{vehicle.plate}</h2>
          <div className="mt-2">
            <Chip>{VEHICLE_TYPE_LABEL[vehicle.type]}</Chip>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar detalle" className={btnIcon}>
          <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-col gap-4 p-5">
        <section className={`${cardClass} flex items-center gap-3 p-3.5`}>
          <Avatar name={vehicle.driverFullName} size="md" tone="muted" />
          <div className="min-w-0">
            <p className="text-[12px] text-ink-2">Conductor</p>
            <p className="truncate text-[15px] font-semibold text-ink">{vehicle.driverFullName}</p>
            <p className="font-mono text-[12px] font-medium text-ink-2">
              DNI {vehicle.driverDni}
              {vehicle.driverPhone ? ` · ${formatPhoneDisplay(vehicle.driverPhone)}` : ""}
            </p>
          </div>
        </section>

        <VehicleRowActions
          vehicleId={vehicle.id}
          type={vehicle.type}
          plate={vehicle.plate}
          driverFullName={vehicle.driverFullName}
          driverDni={vehicle.driverDni}
          driverPhone={vehicle.driverPhone}
          canWrite={canWrite}
          isEditing={editing}
          onStartEdit={() => setEditing(true)}
          onStopEdit={() => setEditing(false)}
        />
      </div>
    </>
  );
}

// Vehiculos en escritorio: tabla + panel con el detalle a la derecha.
export function VehiclesDesktop({
  vehicles,
  canWrite,
}: {
  vehicles: VehicleListItem[];
  canWrite: boolean;
}) {
  return (
    <TableWithPanel
      title="Vehículos"
      noun="vehículo"
      rows={vehicles}
      columns={COLUMNS}
      getRowId={(vehicle) => vehicle.id}
      searchText={(vehicle) => `${vehicle.plate} ${vehicle.driverFullName} ${vehicle.driverDni}`}
      emptyMessage="Todavía no hay vehículos. Cargá el primero con “Agregar vehículo”."
      renderPanel={(vehicle, close) => (
        <VehiclePanel key={vehicle.id} vehicle={vehicle} canWrite={canWrite} onClose={close} />
      )}
    />
  );
}
