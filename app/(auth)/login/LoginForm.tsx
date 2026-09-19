"use client";

import { useActionState } from "react";

import { Spinner } from "@/components/Spinner";
import { LoginIdentifierField } from "@/components/fields/LoginIdentifierField";
import { PasswordField } from "@/components/fields/PasswordField";
import { btnPrimary, inputClass, labelClass } from "@/components/ui/styles";

import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="identifier" className={labelClass}>
          Correo electrónico o DNI
        </label>
        <LoginIdentifierField id="identifier" name="identifier" required className={inputClass} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className={labelClass}>
          Contraseña
        </label>
        <PasswordField
          id="password"
          name="password"
          required
          autoComplete="current-password"
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
            <Spinner className="h-4 w-4" /> Ingresando…
          </>
        ) : (
          "Iniciar sesión"
        )}
      </button>

      <p className="text-center text-sm text-ink-2">
        ¿No podés entrar?{" "}
        <a
          href="/recuperar-contrasena"
          className="inline-flex min-h-[44px] items-center font-medium text-link"
        >
          Pedir ayuda
        </a>
      </p>
    </form>
  );
}
