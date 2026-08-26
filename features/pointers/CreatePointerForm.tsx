"use client";

import { useActionState, useEffect } from "react";

import { Spinner } from "@/components/Spinner";
import { AddressField } from "@/components/fields/AddressField";
import { DniField } from "@/components/fields/DniField";
import { NameField } from "@/components/fields/NameField";
import { PhoneField } from "@/components/fields/PhoneField";

import { createPointerAction, type CreatePointerState } from "./actions";

const initialState: CreatePointerState = { error: null, success: false };
const inputClassName =
  "h-12 rounded-lg border border-zinc-300 px-4 text-base text-zinc-900 focus:border-zinc-500 focus:outline-none";

// El padre (CollapsibleCreatePointer) limpia este formulario: le pasa un
// `key` que cambia en cada alta exitosa, forzando un remontado completo con
// los campos vacios (mismo patron que CreateLeaderForm).
//
// `leaderId` es opcional: solo lo pasa la carga asistida
// (features/carga-asistida), cuando un Administrador de Organización crea
// el puntero para un dirigente que no es él mismo. Viaja como input oculto
// -- createPointerAction lo usa en vez de session.leaderId solo cuando
// session.role === 'superadmin'.
export function CreatePointerForm({
  leaderId,
  onCreated,
}: {
  leaderId?: string;
  onCreated: () => void;
}) {
  const [state, formAction, pending] = useActionState(createPointerAction, initialState);

  useEffect(() => {
    if (state.success) {
      onCreated();
    }
  }, [state, onCreated]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {leaderId ? <input type="hidden" name="leaderId" value={leaderId} /> : null}
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
          "Guardar puntero"
        )}
      </button>
    </form>
  );
}
