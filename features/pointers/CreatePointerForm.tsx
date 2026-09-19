"use client";

import { useActionState } from "react";

import { FormError, FormFooter, useCreatedIntent } from "@/components/ui/FormParts";
import { PersonFields, usePersonFields } from "@/features/identity/PersonFields";
import { fieldErrorsSummary } from "@/utils/form-errors";

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
  const fields = usePersonFields(state.fieldErrors);

  return (
    <form action={formAction} className="flex flex-1 flex-col gap-[14px]">
      <FormError message={state.error ?? fieldErrorsSummary(state.fieldErrors)} />
      {leaderId ? <input type="hidden" name="leaderId" value={leaderId} /> : null}

      <PersonFields f={fields} />

      <FormFooter
        pending={pending}
        disabled={!fields.canSubmit}
        label="Guardar puntero"
        showAgain={showAgain}
        onIntent={setIntent}
      />
    </form>
  );
}
