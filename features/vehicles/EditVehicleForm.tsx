"use client";

import { useState, useTransition } from "react";

import { DniField } from "@/components/fields/DniField";
import { NameField } from "@/components/fields/NameField";
import { PhoneField } from "@/components/fields/PhoneField";
import { PlateField } from "@/components/fields/PlateField";
import type { VehicleType } from "@/types/domain";

import { updateVehicleAction } from "./actions";

const inputClassName = "h-12 w-full rounded-[14px] border border-line-input bg-surface px-3.5 text-base text-ink focus:border-[1.5px] focus:border-ink focus:outline-none";

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
      className="flex flex-col gap-3.5"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor={`edit-vehicle-type-${vehicleId}`} className="text-[13px] font-semibold text-ink-label">
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
        <label htmlFor={`edit-vehicle-plate-${vehicleId}`} className="text-[13px] font-semibold text-ink-label">
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
          className="text-[13px] font-semibold text-ink-label"
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
          className="text-[13px] font-semibold text-ink-label"
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
          className="text-[13px] font-semibold text-ink-label"
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
        <p role="alert" className="text-sm text-err-text">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDone}
          className="h-12 flex-1 rounded-[14px] border border-line-input bg-surface text-sm font-semibold text-ink-label active:bg-muted"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="h-12 flex-1 rounded-[14px] bg-accent text-sm font-semibold text-white active:bg-accent-press disabled:bg-disabled-bg disabled:text-disabled-ink"
        >
          {isPending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
