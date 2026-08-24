"use client";

import { useActionState, useEffect } from "react";

import { Spinner } from "@/components/Spinner";
import { AddressField } from "@/components/fields/AddressField";
import { DniField } from "@/components/fields/DniField";
import { NameField } from "@/components/fields/NameField";
import { PhoneField } from "@/components/fields/PhoneField";

import { createPersonAction, type CreatePersonState } from "./actions";

const initialState: CreatePersonState = { error: null, success: false };
const inputClassName =
  "h-12 rounded-lg border border-zinc-300 px-4 text-base text-zinc-900 focus:border-zinc-500 focus:outline-none";

export function CreatePersonForm({
  pointerId,
  onCreated,
}: {
  pointerId: string;
  onCreated: () => void;
}) {
  const actionWithPointer = createPersonAction.bind(null, pointerId);
  const [state, formAction, pending] = useActionState(actionWithPointer, initialState);

  useEffect(() => {
    if (state.success) {
      onCreated();
    }
  }, [state, onCreated]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="fullName" className="text-sm font-medium text-zinc-700">
          Nombre completo *
        </label>
        <NameField id="fullName" name="fullName" required className={inputClassName} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="dni" className="text-sm font-medium text-zinc-700">
          DNI *
        </label>
        <DniField id="dni" name="dni" required className={inputClassName} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm font-medium text-zinc-700">
          Teléfono (opcional)
        </label>
        <PhoneField id="phone" name="phone" className={inputClassName} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="address" className="text-sm font-medium text-zinc-700">
          Dirección (opcional)
        </label>
        <AddressField id="address" name="address" className={inputClassName} />
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
          "Agregar persona"
        )}
      </button>
    </form>
  );
}
