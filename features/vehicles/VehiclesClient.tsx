"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { normalizeDni } from "@/utils/dni";

import { CollapsibleCreateVehicle } from "./CollapsibleCreateVehicle";
import { VehiclesList } from "./VehiclesList";
import type { VehicleListItem } from "./queries";

export function VehiclesClient({
  vehicles,
  canWrite,
}: {
  vehicles: VehicleListItem[];
  canWrite: boolean;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [closeCreateSignal, setCloseCreateSignal] = useState<number>();

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open);
    if (open) {
      setEditingId(null);
    }
  }

  function handleStartEdit(id: string) {
    setEditingId(id);
    setCloseCreateSignal((value) => (value ?? 0) + 1);
  }

  const normalizedQuery = query.trim().toLowerCase();
  const normalizedDniQuery = normalizeDni(query);

  const filteredVehicles = useMemo(() => {
    if (!normalizedQuery) return vehicles;
    return vehicles.filter((vehicle) => {
      const plateMatch = vehicle.plate.toLowerCase().includes(normalizedQuery);
      const driverMatch = vehicle.driverFullName.toLowerCase().includes(normalizedQuery);
      const dniMatch =
        normalizedDniQuery.length > 0 && vehicle.driverDni.includes(normalizedDniQuery);
      return plateMatch || driverMatch || dniMatch;
    });
  }, [vehicles, normalizedQuery, normalizedDniQuery]);

  return (
    <div className="flex flex-col gap-4">
      <CollapsibleCreateVehicle
        canWrite={canWrite}
        onOpenChange={handleFormOpenChange}
        closeSignal={closeCreateSignal}
      />

      {!formOpen ? (
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400">
            <Search className="h-4 w-4" aria-hidden="true" />
          </span>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por patente, nombre o DNI"
            className="h-12 w-full rounded-lg border border-zinc-300 pl-10 pr-4 text-base text-zinc-900 focus:border-zinc-500 focus:outline-none"
          />
        </div>
      ) : null}

      <VehiclesList
        vehicles={formOpen ? vehicles : filteredVehicles}
        emptyMessage={
          normalizedQuery
            ? "No encontramos ningún vehículo con esos datos."
            : "Todavía no hay vehículos cargados. Cargá el primero con el botón de arriba."
        }
        canWrite={canWrite}
        editingId={formOpen ? null : editingId}
        onStartEdit={handleStartEdit}
        onStopEdit={() => setEditingId(null)}
      />
    </div>
  );
}
