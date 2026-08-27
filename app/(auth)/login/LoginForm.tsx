"use client";

import { useActionState } from "react";

import { Spinner } from "@/components/Spinner";
import { LoginIdentifierField } from "@/components/fields/LoginIdentifierField";
import { PasswordField } from "@/components/fields/PasswordField";

import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="identifier" className="text-sm font-medium text-zinc-700">
          Correo electrónico o DNI
        </label>
        <LoginIdentifierField
          id="identifier"
          name="identifier"
          required
          className="h-12 rounded-lg border border-zinc-300 px-4 text-base text-zinc-900 focus:border-zinc-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-zinc-700">
          Contraseña
        </label>
        <PasswordField
          id="password"
          name="password"
          required
          autoComplete="current-password"
          className="h-12 rounded-lg border border-zinc-300 px-4 text-base text-zinc-900 focus:border-zinc-500 focus:outline-none"
        />
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
            <Spinner className="h-4 w-4" /> Ingresando…
          </>
        ) : (
          "Iniciar sesión"
        )}
      </button>

      <a
        href="/recuperar-contrasena"
        className="text-center text-sm text-zinc-600 underline underline-offset-2"
      >
        ¿No podés entrar?
      </a>
    </form>
  );
}
