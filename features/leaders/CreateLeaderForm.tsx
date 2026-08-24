"use client";

import { useActionState, useEffect, useState } from "react";

import { Spinner } from "@/components/Spinner";
import { DniField } from "@/components/fields/DniField";
import { NameField } from "@/components/fields/NameField";
import { PhoneField } from "@/components/fields/PhoneField";

import { createLeaderAction, type CreateLeaderState } from "./actions";

const initialState: CreateLeaderState = { error: null, success: false };
const inputClassName =
  "h-12 rounded-lg border border-zinc-300 px-4 text-base text-zinc-900 focus:border-zinc-500 focus:outline-none";

const SUCCESS_MESSAGE_MS = 4000;

export function CreateLeaderForm() {
  const [state, formAction, pending] = useActionState(createLeaderAction, initialState);
  // Los campos son controlados por sus propios componentes (DniField, etc.),
  // asi que un form.reset() nativo no los limpiaria. En cambio, al guardar
  // con exito cambiamos la key del form para remontarlo entero con campos
  // vacios.
  const [formKey, setFormKey] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // Patron "ajustar estado durante el render" (en vez de useEffect) para
  // reaccionar a que state.success paso a true: https://react.dev/learn/you-might-not-need-an-effect
  const [handledSuccess, setHandledSuccess] = useState(state.success);
  if (state.success !== handledSuccess) {
    setHandledSuccess(state.success);
    if (state.success) {
      setFormKey((key) => key + 1);
      setShowSuccess(true);
    }
  }

  useEffect(() => {
    if (!showSuccess) return;
    const timeout = setTimeout(() => setShowSuccess(false), SUCCESS_MESSAGE_MS);
    return () => clearTimeout(timeout);
  }, [showSuccess]);

  return (
    <form key={formKey} action={formAction} className="flex flex-col gap-3">
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

      {state.error ? (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}
      {showSuccess ? (
        <p role="status" className="text-sm text-green-700">
          ✅ El dirigente fue creado exitosamente. Para darle acceso, usá el botón de invitar en su
          fila de la lista.
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
          "Guardar dirigente"
        )}
      </button>
    </form>
  );
}
