"use client";

import { useMemo, useState } from "react";

import { ActionBar } from "@/components/ui/ActionBar";
import { CreateSheet } from "@/components/ui/CreateSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { ENTITY_ICON } from "@/components/ui/entityIcons";
import { Screen } from "@/components/ui/Screen";
import { SearchField } from "@/components/ui/SearchField";
import { TopbarActions } from "@/components/desktop/ShellContext";
import { normalizeDni } from "@/utils/dni";

import { CreateVehicleForm } from "./CreateVehicleForm";
import { VehiclesDesktop } from "./VehiclesDesktop";
import { VehiclesList } from "./VehiclesList";
import type { VehicleListItem } from "./queries";

export function VehiclesClient({
  vehicles,
  canWrite,
  exportSlot,
  exportDesktopSlot,
}: {
  vehicles: VehicleListItem[];
  canWrite: boolean;
  exportSlot: React.ReactNode;
  exportDesktopSlot: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

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
    <Screen
      shell
      desktopContent
      title="Mis Vehículos"
      backHref="/dirigente"
      headerRight={<span className="font-mono text-[13px] font-medium text-ink-2">{vehicles.length}</span>}
      headerExtra={
        vehicles.length > 0 ? (
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Patente, nombre o DNI"
            label="Buscar vehículos"
          />
        ) : null
      }
      bar={
        <ActionBar>
          <div className="flex items-center gap-3">
            {exportSlot}
            <CreateSheet
              icon={ENTITY_ICON.vehicle}
              triggerLabel="Agregar vehículo"
              title="Agregar vehículo"
              canWrite={canWrite}
              lockedMessage="La carga está cerrada en este momento. Podés consultar tus vehículos, pero no agregar ni modificar nada."
              successMessage="El vehículo fue agregado exitosamente."
              renderForm={(onCreated) => <CreateVehicleForm onCreated={onCreated} />}
            />
          </div>
        </ActionBar>
      }
    >
      <TopbarActions>
        {exportDesktopSlot}
        <CreateSheet
          variant="topbar"
          triggerLabel="Agregar vehículo"
          title="Agregar vehículo"
          canWrite={canWrite}
          successMessage="El vehículo fue agregado exitosamente."
          renderForm={(onCreated) => <CreateVehicleForm onCreated={onCreated} />}
        />
      </TopbarActions>

      <div className="hidden lg:block">
        <VehiclesDesktop vehicles={vehicles} canWrite={canWrite} />
      </div>

      <div className="flex flex-col gap-4 lg:hidden">
      <VehiclesList
        vehicles={filteredVehicles}
        empty={
          normalizedQuery ? (
            <EmptyState variant="search" title={`Sin resultados para “${query.trim()}”`}>
              No encontramos ningún vehículo con esos datos.
            </EmptyState>
          ) : (
            <EmptyState variant="blank" title="Todavía no hay vehículos">
              Cargá el primero con el botón de abajo.
            </EmptyState>
          )
        }
        canWrite={canWrite}
        editingId={editingId}
        onStartEdit={setEditingId}
        onStopEdit={() => setEditingId(null)}
      />
      </div>
    </Screen>
  );
}
