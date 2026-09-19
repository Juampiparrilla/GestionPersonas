"use client";

import { useActionState } from "react";

import { FormError, FormFooter, useCreatedIntent } from "@/components/ui/FormParts";
import { PersonFields, usePersonFields } from "@/features/identity/PersonFields";
import { fieldErrorsSummary } from "@/utils/form-errors";

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
  const fields = usePersonFields(state.fieldErrors);

  return (
    <form action={formAction} className="flex flex-1 flex-col gap-[14px]">
      <FormError message={state.error ?? fieldErrorsSummary(state.fieldErrors)} />

      <PersonFields f={fields} />

      <FormFooter
        pending={pending}
        disabled={!fields.canSubmit}
        label="Guardar persona"
        showAgain={showAgain}
        onIntent={setIntent}
      />
    </form>
  );
}
