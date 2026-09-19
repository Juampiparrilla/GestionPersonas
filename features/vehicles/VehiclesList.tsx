import { VehicleCard } from "./VehicleCard";
import type { VehicleListItem } from "./queries";

export function VehiclesList({
  vehicles,
  empty,
  canWrite,
  editingId,
  onStartEdit,
  onStopEdit,
}: {
  vehicles: VehicleListItem[];
  empty: React.ReactNode;
  canWrite: boolean;
  editingId: string | null;
  onStartEdit: (id: string) => void;
  onStopEdit: () => void;
}) {
  if (vehicles.length === 0) {
    return <>{empty}</>;
  }

  return (
    <div className="flex flex-col gap-[9px]">
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
