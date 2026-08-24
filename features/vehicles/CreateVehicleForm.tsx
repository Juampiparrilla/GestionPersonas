"use client";

import { useActionState, useEffect } from "react";

import { Spinner } from "@/components/Spinner";
import { DniField } from "@/components/fields/DniField";
import { NameField } from "@/components/fields/NameField";
import { PhoneField } from "@/components/fields/PhoneField";
import { PlateField } from "@/components/fields/PlateField";

import { createVehicleAction, type CreateVehicleState } from "./actions";

const initialState: CreateVehicleState = { error: null, success: false };
const inputClassName =
  "h-12 rounded-lg border border-zinc-300 px-4 text-base text-zinc-900 focus:border-zinc-500 focus:outline-none";

export function CreateVehicleForm({ onCreated }: { onCreated: () => void }) {
  const [state, formAction, pending] = useActionState(createVehicleAction, initialState);

  useEffect(() => {
    if (state.success) {
      onCreated();
    }
  }, [state, onCreated]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="type" className="text-sm font-medium text-zinc-700">
          Tipo de vehículo *
        </label>
        <select id="type" name="type" required defaultValue="" className={inputClassName}>
          <option value="" disabled>
            Elegí un tipo
          </option>
          <option value="auto">Auto</option>
          <option value="moto">Moto</option>
          <option value="traffic">Traffic</option>
          <option value="colectivo">Colectivo</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="plate" className="text-sm font-medium text-zinc-700">
          Patente *
        </label>
        <PlateField id="plate" name="plate" required className={inputClassName} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="driverFullName" className="text-sm font-medium text-zinc-700">
          Nombre del conductor *
        </label>
        <NameField id="driverFullName" name="driverFullName" required className={inputClassName} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="driverDni" className="text-sm font-medium text-zinc-700">
          DNI del conductor *
        </label>
        <DniField id="driverDni" name="driverDni" required className={inputClassName} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="driverPhone" className="text-sm font-medium text-zinc-700">
          Teléfono (opcional)
        </label>
        <PhoneField id="driverPhone" name="driverPhone" className={inputClassName} />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 items-center justify-center gap-2 rounded-lg bg-zinc-900 text-base font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-60"
      >
        {pending ? (
          <>
            <Spinner className="h-4 w-4" /> Guardando…
          </>
        ) : (
          "Agregar vehículo"
        )}
      </button>
    </form>
  );
}
