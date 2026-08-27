import { Car } from "lucide-react";

import { VehicleCard } from "./VehicleCard";
import type { VehicleListItem } from "./queries";

export function VehiclesList({
  vehicles,
  emptyMessage = "Todavía no hay vehículos cargados.",
  canWrite,
  editingId,
  onStartEdit,
  onStopEdit,
  onRequestCreate,
}: {
  vehicles: VehicleListItem[];
  emptyMessage?: string;
  canWrite: boolean;
  editingId: string | null;
  onStartEdit: (id: string) => void;
  onStopEdit: () => void;
  onRequestCreate?: () => void;
}) {
  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-white p-6 text-center">
        <p className="text-zinc-600">{emptyMessage}</p>
        {canWrite && onRequestCreate ? (
          <button
            type="button"
            onClick={onRequestCreate}
            className="flex h-11 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            <Car className="h-4 w-4" aria-hidden="true" />
            Agregar vehículo
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {vehicles.map((vehicle) => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          canWrite={canWrite}
          isEditing={editingId === vehicle.id}
          onStartEdit={() => onStartEdit(vehicle.id)}
          onStopEdit={onStopEdit}
        />
      ))}
    </div>
  );
}
