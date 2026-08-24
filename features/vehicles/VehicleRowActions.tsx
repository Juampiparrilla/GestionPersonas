"use client";

import { useState, useTransition } from "react";

import { Spinner } from "@/components/Spinner";
import type { VehicleType } from "@/types/domain";

import { removeVehicleAction } from "./actions";
import { EditVehicleForm } from "./EditVehicleForm";

export function VehicleRowActions({
  vehicleId,
  type,
  plate,
  driverFullName,
  driverDni,
  driverPhone,
  canWrite,
  isEditing,
  onStartEdit,
  onStopEdit,
}: {
  vehicleId: string;
  type: VehicleType;
  plate: string;
  driverFullName: string;
  driverDni: string;
  driverPhone: string | null;
  canWrite: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function confirmRemove() {
    setError(null);
    startTransition(async () => {
      const result = await removeVehicleAction(vehicleId);
      if (result.error) {
        setError(result.error);
      } else {
        setConfirmingRemove(false);
      }
    });
  }

  if (!canWrite) return null;

  if (isEditing) {
    return (
      <EditVehicleForm
        vehicleId={vehicleId}
        type={type}
        plate={plate}
        driverFullName={driverFullName}
        driverDni={driverDni}
        driverPhone={driverPhone}
        onDone={onStopEdit}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
        <button
          type="button"
          onClick={onStartEdit}
          disabled={isPending}
          className="h-10 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
        >
          ✏️ Editar
        </button>

        {!confirmingRemove ? (
          <button
            type="button"
            onClick={() => setConfirmingRemove(true)}
            disabled={isPending}
            className="h-10 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
          >
            🗑️ Quitar
          </button>
        ) : null}
      </div>

      {confirmingRemove ? (
        <div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
          <p className="text-red-800">¿Querés quitar este vehículo?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmingRemove(false)}
              disabled={isPending}
              className="h-9 flex-1 rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700 disabled:opacity-60"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={confirmRemove}
              disabled={isPending}
              className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 text-sm font-medium text-white disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <Spinner className="h-4 w-4" /> Quitando…
                </>
              ) : (
                "Sí, quitar"
              )}
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
