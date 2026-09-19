"use client";

import { useActionState } from "react";

import { AddressField } from "@/components/fields/AddressField";
import { DniField } from "@/components/fields/DniField";
import { NameField } from "@/components/fields/NameField";
import { PhoneField } from "@/components/fields/PhoneField";
import { Field, FormError, FormFooter, useCreatedIntent } from "@/components/ui/FormParts";
import { inputClass, inputMonoClass } from "@/components/ui/styles";

import { createLeaderAction, type CreateLeaderState } from "./actions";

const initialState: CreateLeaderState = { error: null, success: false };

// El padre (CreateSheet) es quien limpia este formulario: le pasa un `key`
// que cambia cada vez que hay un alta exitosa, forzando un remontado
// completo (los campos son controlados por sus propios componentes, un
// form.reset() nativo no alcanzaria). Este componente solo avisa "se creo"
// via onCreated, nunca se reinicia a si mismo.
export function CreateLeaderForm({ onCreated }: { onCreated: (again: boolean) => void }) {
  const [state, formAction, pending] = useActionState(createLeaderAction, initialState);
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

      <FormFooter pending={pending} label="Guardar dirigente" onIntent={setIntent} />
    </form>
  );
}
