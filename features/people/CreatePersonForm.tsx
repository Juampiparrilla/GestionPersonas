"use client";

import { useActionState } from "react";

import { AddressField } from "@/components/fields/AddressField";
import { DniField } from "@/components/fields/DniField";
import { NameField } from "@/components/fields/NameField";
import { PhoneField } from "@/components/fields/PhoneField";
import { Field, FormError, FormFooter, useCreatedIntent } from "@/components/ui/FormParts";
import { inputClass, inputMonoClass } from "@/components/ui/styles";

import { createPersonAction, type CreatePersonState } from "./actions";

const initialState: CreatePersonState = { error: null, success: false };

export function CreatePersonForm({
  pointerId,
  onCreated,
  showAgain = true,
}: {
  pointerId: string;
  onCreated: (again: boolean) => void;
  showAgain?: boolean;
}) {
  const actionWithPointer = createPersonAction.bind(null, pointerId);
  const [state, formAction, pending] = useActionState(actionWithPointer, initialState);
  const setIntent = useCreatedIntent(state, onCreated);

  return (
    <form action={formAction} className="flex flex-1 flex-col gap-[14px]">
      <FormError message={state.error} />

      <Field id="fullName" label="Nombre completo" required hint="Apellido primero, después el nombre.">
        <NameField id="fullName" name="fullName" required className={inputClass} />
      </Field>

      <Field id="dni" label="DNI" required>
        <DniField id="dni" name="dni" required className={inputMonoClass} />
      </Field>

      <Field id="phone" label="Teléfono">
        <PhoneField id="phone" name="phone" className={inputMonoClass} />
      </Field>

      <Field id="address" label="Dirección">
        <AddressField id="address" name="address" className={inputClass} />
      </Field>

      <FormFooter
        pending={pending}
        label="Guardar persona"
        showAgain={showAgain}
        onIntent={setIntent}
      />
    </form>
  );
}
