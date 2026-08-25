"use client";

import { useActionState, useEffect } from "react";

import { Spinner } from "@/components/Spinner";
import { DniField } from "@/components/fields/DniField";
import { NameField } from "@/components/fields/NameField";
import { PhoneField } from "@/components/fields/PhoneField";

import { createOrganizationAction, type CreateOrganizationState } from "./actions";

const initialState: CreateOrganizationState = { error: null, success: false };
const inputClassName =
  "h-12 rounded-lg border border-zinc-300 px-4 text-base text-zinc-900 focus:border-zinc-500 focus:outline-none";

// El padre (CollapsibleCreateOrganization) limpia este formulario pasandole
// un `key` que cambia en cada alta exitosa -- mismo patron que
// CreateLeaderForm.
export function CreateOrganizationForm({ onCreated }: { onCreated: () => void }) {
  const [state, formAction, pending] = useActionState(createOrganizationAction, initialState);

  useEffect(() => {
    if (state.success) {
      onCreated();
    }
  }, [state, onCreated]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="orgName" className="text-sm font-medium text-zinc-700">
          Nombre de la organización *
        </label>
        <input id="orgName" name="orgName" required className={inputClassName} />
      </div>

      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Administrador de la organización
      </p>

      <div className="flex flex-col gap-1">
        <label htmlFor="adminFullName" className="text-sm font-medium text-zinc-700">
          Nombre completo *
        </label>
        <NameField id="adminFullName" name="adminFullName" required className={inputClassName} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="adminDni" className="text-sm font-medium text-zinc-700">
          DNI *
        </label>
        <DniField id="adminDni" name="adminDni" required className={inputClassName} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="adminEmail" className="text-sm font-medium text-zinc-700">
          Correo electrónico (opcional)
        </label>
        <input id="adminEmail" name="adminEmail" type="email" className={inputClassName} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="adminPhone" className="text-sm font-medium text-zinc-700">
          Teléfono (opcional)
        </label>
        <PhoneField id="adminPhone" name="adminPhone" className={inputClassName} />
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
            <Spinner className="h-4 w-4" /> Creando…
          </>
        ) : (
          "Crear organización"
        )}
      </button>
    </form>
  );
}
