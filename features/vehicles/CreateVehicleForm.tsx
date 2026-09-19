"use client";

import { useActionState } from "react";

import { DniField } from "@/components/fields/DniField";
import { NameField } from "@/components/fields/NameField";
import { PhoneField } from "@/components/fields/PhoneField";
import { PlateField } from "@/components/fields/PlateField";
import { Field, FormError, FormFooter, useCreatedIntent } from "@/components/ui/FormParts";
import { inputClass, inputErrorClass, inputMonoClass } from "@/components/ui/styles";
import { useFormFields } from "@/components/ui/useFormFields";
import { fieldErrorsSummary } from "@/utils/form-errors";
import { validateDni, validateFullName, validatePhone, validatePlate } from "@/utils/validation";

import { createVehicleAction, type CreateVehicleState } from "./actions";

const initialState: CreateVehicleState = { error: null, success: false };

type VehicleFieldName = "type" | "plate" | "driverFullName" | "driverDni" | "driverPhone";

const FIELD_ORDER: VehicleFieldName[] = [
  "type",
  "plate",
  "driverFullName",
  "driverDni",
  "driverPhone",
];

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
  const f = useFormFields<VehicleFieldName>({
    initial: { type: "", plate: "", driverFullName: "", driverDni: "", driverPhone: "" },
    validators: {
      type: (value) => (value ? null : "Elegí un tipo de vehículo."),
      plate: validatePlate,
      driverFullName: validateFullName,
      driverDni: validateDni,
      driverPhone: validatePhone,
    },
    serverErrors: state.fieldErrors,
    order: FIELD_ORDER,
  });

  return (
    <form action={formAction} className="flex flex-1 flex-col gap-[14px]">
      <FormError message={state.error ?? fieldErrorsSummary(state.fieldErrors)} />
      {leaderId ? <input type="hidden" name="leaderId" value={leaderId} /> : null}

      <Field id="type" label="Tipo de vehículo" required error={f.error("type")}>
        <select
          id="type"
          name="type"
          required
          value={f.values.type}
          onChange={(event) => f.setValue("type", event.target.value)}
          onBlur={() => f.blur("type")}
          aria-invalid={f.error("type") ? true : undefined}
          className={`${inputClass} ${f.error("type") ? inputErrorClass : ""}`}
        >
          <option value="" disabled>
            Elegí un tipo
          </option>
          <option value="auto">Auto</option>
          <option value="moto">Moto</option>
          <option value="traffic">Traffic</option>
          <option value="colectivo">Colectivo</option>
        </select>
      </Field>

      <Field id="plate" label="Patente" required error={f.error("plate")}>
        <PlateField
          id="plate"
          name="plate"
          required
          className={inputMonoClass}
          value={f.values.plate}
          onValueChange={(value) => f.setValue("plate", value)}
          onBlur={() => f.blur("plate")}
          invalid={Boolean(f.error("plate"))}
          describedBy={f.error("plate") ? "plate-error" : undefined}
        />
      </Field>

      <Field
        id="driverFullName"
        label="Nombre del conductor"
        required
        hint="Apellido primero, después el nombre."
        error={f.error("driverFullName")}
      >
        <NameField
          id="driverFullName"
          name="driverFullName"
          required
          className={inputClass}
          value={f.values.driverFullName}
          onValueChange={(value) => f.setValue("driverFullName", value)}
          onBlur={() => f.blur("driverFullName")}
          invalid={Boolean(f.error("driverFullName"))}
          describedBy={f.error("driverFullName") ? "driverFullName-error" : undefined}
        />
      </Field>

      <Field id="driverDni" label="DNI del conductor" required error={f.error("driverDni")}>
        <DniField
          id="driverDni"
          name="driverDni"
          required
          className={inputMonoClass}
          value={f.values.driverDni}
          onValueChange={(value) => f.setValue("driverDni", value)}
          onBlur={() => f.blur("driverDni")}
          invalid={Boolean(f.error("driverDni"))}
          describedBy={f.error("driverDni") ? "driverDni-error" : undefined}
        />
      </Field>

      <Field id="driverPhone" label="Teléfono del conductor" error={f.error("driverPhone")}>
        <PhoneField
          id="driverPhone"
          name="driverPhone"
          className={inputMonoClass}
          value={f.values.driverPhone}
          onValueChange={(value) => f.setValue("driverPhone", value)}
          onBlur={() => f.blur("driverPhone")}
          invalid={Boolean(f.error("driverPhone"))}
          describedBy={f.error("driverPhone") ? "driverPhone-error" : undefined}
        />
      </Field>

      <FormFooter
        pending={pending}
        disabled={!f.canSubmit}
        label="Guardar vehículo"
        showAgain={showAgain}
        onIntent={setIntent}
      />
    </form>
  );
}
