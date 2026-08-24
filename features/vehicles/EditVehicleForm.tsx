"use client";

import { useState, useTransition } from "react";

import { DniField } from "@/components/fields/DniField";
import { NameField } from "@/components/fields/NameField";
import { PhoneField } from "@/components/fields/PhoneField";
import { PlateField } from "@/components/fields/PlateField";
import type { VehicleType } from "@/types/domain";

import { updateVehicleAction } from "./actions";

const inputClassName = "h-11 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-900";

export function EditVehicleForm({
  vehicleId,
  type,
  plate,
  driverFullName,
  driverDni,
  driverPhone,
  onDone,
}: {
  vehicleId: string;
  type: VehicleType;
  plate: string;
  driverFullName: string;
  driverDni: string;
  driverPhone: string | null;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    const newType = String(formData.get("type") ?? "") as VehicleType;
    const newPlate = String(formData.get("plate") ?? "").trim();
    const newDriverFullName = String(formData.get("driverFullName") ?? "").trim();
    const newDriverDni = String(formData.get("driverDni") ?? "").trim();
    const newDriverPhone = String(formData.get("driverPhone") ?? "").trim();

    if (!newPlate || !newDriverFullName || !newDriverDni) {
      setError("Completá la patente, el nombre y el DNI del conductor.");
      return;
    }

    startTransition(async () => {
      const result = await updateVehicleAction(
        vehicleId,
        newType,
        newPlate,
        newDriverFullName,
        newDriverDni,
        newDriverPhone || null
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      onDone();
    });
  }

  return (
    <form
      action={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor={`edit-vehicle-type-${vehicleId}`} className="text-sm font-medium text-zinc-700">
          Tipo de vehículo
        </label>
        <select
          id={`edit-vehicle-type-${vehicleId}`}
          name="type"
          defaultValue={type}
          className={inputClassName}
        >
          <option value="auto">Auto</option>
          <option value="moto">Moto</option>
          <option value="traffic">Traffic</option>
          <option value="colectivo">Colectivo</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`edit-vehicle-plate-${vehicleId}`} className="text-sm font-medium text-zinc-700">
          Patente
        </label>
        <PlateField
          id={`edit-vehicle-plate-${vehicleId}`}
          name="plate"
          defaultValue={plate}
          className={inputClassName}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor={`edit-vehicle-driver-name-${vehicleId}`}
          className="text-sm font-medium text-zinc-700"
        >
          Nombre del conductor
        </label>
        <NameField
          id={`edit-vehicle-driver-name-${vehicleId}`}
          name="driverFullName"
          defaultValue={driverFullName}
          className={inputClassName}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor={`edit-vehicle-driver-dni-${vehicleId}`}
          className="text-sm font-medium text-zinc-700"
        >
          DNI del conductor
        </label>
        <DniField
          id={`edit-vehicle-driver-dni-${vehicleId}`}
          name="driverDni"
          defaultValue={driverDni}
          className={inputClassName}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor={`edit-vehicle-driver-phone-${vehicleId}`}
          className="text-sm font-medium text-zinc-700"
        >
          Teléfono
        </label>
        <PhoneField
          id={`edit-vehicle-driver-phone-${vehicleId}`}
          name="driverPhone"
          defaultValue={driverPhone ?? ""}
          className={inputClassName}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDone}
          className="h-10 flex-1 rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="h-10 flex-1 rounded-lg bg-zinc-900 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isPending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
