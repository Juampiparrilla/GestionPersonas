"use client";

import { useActionState } from "react";

import { FormError, FormFooter, useCreatedIntent } from "@/components/ui/FormParts";
import { PersonFields, usePersonFields } from "@/features/identity/PersonFields";
import { fieldErrorsSummary } from "@/utils/form-errors";

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
  const fields = usePersonFields(state.fieldErrors);

  return (
    <form action={formAction} className="flex flex-1 flex-col gap-[14px]">
      <FormError message={state.error ?? fieldErrorsSummary(state.fieldErrors)} />

      <PersonFields f={fields} />

      <FormFooter
        pending={pending}
        disabled={!fields.canSubmit}
        label="Guardar dirigente"
        onIntent={setIntent}
      />
    </form>
  );
}
