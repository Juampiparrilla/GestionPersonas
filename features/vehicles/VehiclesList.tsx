import { VehicleCard } from "./VehicleCard";
import type { VehicleListItem } from "./queries";

export function VehiclesList({
  vehicles,
  emptyMessage = "Todavía no hay vehículos cargados. Cargá el primero con el botón de arriba.",
  canWrite,
  editingId,
  onStartEdit,
  onStopEdit,
}: {
  vehicles: VehicleListItem[];
  emptyMessage?: string;
  canWrite: boolean;
  editingId: string | null;
  onStartEdit: (id: string) => void;
  onStopEdit: () => void;
}) {
  if (vehicles.length === 0) {
    return (
      <p className="rounded-xl border border-zinc-200 bg-white p-4 text-center text-zinc-600">
        {emptyMessage}
      </p>
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
