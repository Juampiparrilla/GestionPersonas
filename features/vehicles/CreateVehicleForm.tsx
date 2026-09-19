"use client";

import { useActionState } from "react";

import { DniField } from "@/components/fields/DniField";
import { NameField } from "@/components/fields/NameField";
import { PhoneField } from "@/components/fields/PhoneField";
import { PlateField } from "@/components/fields/PlateField";
import { Field, FormError, FormFooter, useCreatedIntent } from "@/components/ui/FormParts";
import { inputClass, inputMonoClass } from "@/components/ui/styles";

import { createVehicleAction, type CreateVehicleState } from "./actions";

const initialState: CreateVehicleState = { error: null, success: false };

// `leaderId` es opcional: solo lo pasa la carga asistida
// (features/carga-asistida) -- ver el mismo patrón en CreatePointerForm.
export function CreateVehicleForm({
  leaderId,
  onCreated,
  showAgain = true,
}: {
  leaderId?: string;
  onCreated: (again: boolean) => void;
  showAgain?: boolean;
}) {
  const [state, formAction, pending] = useActionState(createVehicleAction, initialState);
  const setIntent = useCreatedIntent(state, onCreated);

  return (
    <form action={formAction} className="flex flex-1 flex-col gap-[14px]">
      <FormError message={state.error} />
      {leaderId ? <input type="hidden" name="leaderId" value={leaderId} /> : null}

      <Field id="type" label="Tipo de vehículo" required>
        <select id="type" name="type" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Elegí un tipo
          </option>
          <option value="auto">Auto</option>
          <option value="moto">Moto</option>
          <option value="traffic">Traffic</option>
          <option value="colectivo">Colectivo</option>
        </select>
      </Field>

      <Field id="plate" label="Patente" required>
        <PlateField id="plate" name="plate" required className={inputMonoClass} />
      </Field>

      <Field
        id="driverFullName"
        label="Nombre del conductor"
        required
        hint="Apellido primero, después el nombre."
      >
        <NameField id="driverFullName" name="driverFullName" required className={inputClass} />
      </Field>

      <Field id="driverDni" label="DNI del conductor" required>
        <DniField id="driverDni" name="driverDni" required className={inputMonoClass} />
      </Field>

      <Field id="driverPhone" label="Teléfono del conductor">
        <PhoneField id="driverPhone" name="driverPhone" className={inputMonoClass} />
      </Field>

      <FormFooter
        pending={pending}
        label="Guardar vehículo"
        showAgain={showAgain}
        onIntent={setIntent}
      />
    </form>
  );
}
