"use client";

import { useActionState } from "react";

import { AddressField } from "@/components/fields/AddressField";
import { DniField } from "@/components/fields/DniField";
import { NameField } from "@/components/fields/NameField";
import { PhoneField } from "@/components/fields/PhoneField";
import { Field, FormError, FormFooter, useCreatedIntent } from "@/components/ui/FormParts";
import { inputClass, inputMonoClass } from "@/components/ui/styles";

import { createPointerAction, type CreatePointerState } from "./actions";

const initialState: CreatePointerState = { error: null, success: false };

// El padre (CreateSheet) limpia este formulario: le pasa un `key` que cambia
// en cada alta exitosa, forzando un remontado completo con los campos vacios
// (mismo patron que CreateLeaderForm).
//
// `leaderId` es opcional: solo lo pasa la carga asistida
// (features/carga-asistida), cuando un Administrador de Organización crea
// el puntero para un dirigente que no es él mismo. Viaja como input oculto
// -- createPointerAction lo usa en vez de session.leaderId solo cuando
// session.role === 'superadmin'.
export function CreatePointerForm({
  leaderId,
  onCreated,
  showAgain = true,
}: {
  leaderId?: string;
  onCreated: (again: boolean) => void;
  showAgain?: boolean;
}) {
  const [state, formAction, pending] = useActionState(createPointerAction, initialState);
  const setIntent = useCreatedIntent(state, onCreated);

  return (
    <form action={formAction} className="flex flex-1 flex-col gap-[14px]">
      <FormError message={state.error} />
      {leaderId ? <input type="hidden" name="leaderId" value={leaderId} /> : null}

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
        label="Guardar puntero"
        showAgain={showAgain}
        onIntent={setIntent}
      />
    </form>
  );
}
