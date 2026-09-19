"use client";

import { useActionState } from "react";

import { Spinner } from "@/components/Spinner";
import { PasswordField } from "@/components/fields/PasswordField";
import { btnPrimary, inputClass, labelClass } from "@/components/ui/styles";

import { updatePassword, type UpdatePasswordState } from "./actions";

const initialState: UpdatePasswordState = { error: null };

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className={labelClass}>
          Contraseña nueva
        </label>
        <PasswordField
          id="password"
          name="password"
          required
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className={labelClass}>
          Repetí la contraseña
        </label>
        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          required
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      {state.error ? (
        <p
          role="alert"
          className="rounded-2xl border border-err-border bg-err-bg p-3.5 text-sm text-err-ink"
        >
          {state.error}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? (
          <>
            <Spinner className="h-4 w-4" /> Guardando…
          </>
        ) : (
          "Guardar contraseña"
        )}
      </button>
    </form>
  );
}
