"use client";

import { useActionState, useEffect, useState } from "react";

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
  // El link de acceso (WhatsApp o para copiar) queda disponible en `state`
  // hasta el proximo submit; este flag lo oculta apenas se usa, sin esperar
  // a esa proxima carga.
  const [linkDismissed, setLinkDismissed] = useState(false);
  const [wantsAccess, setWantsAccess] = useState(false);

  // Patron "ajustar estado durante el render" (en vez de useEffect) para
  // reaccionar a que state.success paso a true: https://react.dev/learn/you-might-not-need-an-effect
  const [handledSuccess, setHandledSuccess] = useState(state.success);
  if (state.success !== handledSuccess) {
    setHandledSuccess(state.success);
    if (state.success) {
      setFormKey((key) => key + 1);
      setShowSuccess(true);
      setLinkDismissed(false);
      setWantsAccess(false);
    }
  }

  useEffect(() => {
    if (!showSuccess) return;
    const timeout = setTimeout(() => setShowSuccess(false), SUCCESS_MESSAGE_MS);
    return () => clearTimeout(timeout);
  }, [showSuccess]);

  return (
    <form
      key={formKey}
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4"
    >
      <h2 className="font-medium text-zinc-900">Agregar dirigente</h2>

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
          Teléfono {wantsAccess ? "" : "(opcional)"}
        </label>
        <PhoneField id="phone" name="phone" className={inputClassName} />
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
        <input
          type="checkbox"
          name="wantsAccess"
          checked={wantsAccess}
          onChange={(event) => setWantsAccess(event.target.checked)}
          className="h-5 w-5 rounded border-zinc-300"
        />
        Darle acceso a la aplicación
      </label>

      {wantsAccess ? (
        <div className="flex flex-col gap-1 rounded-lg bg-zinc-50 p-3">
          <p className="text-sm text-zinc-700">
            Va a poder ingresar con su <strong>DNI</strong> y una contraseña que va a crear él
            mismo. Con el teléfono cargado arriba, te dejamos mandarle el link por WhatsApp.
          </p>
          <label htmlFor="email" className="mt-2 text-sm font-medium text-zinc-700">
            Correo electrónico (opcional)
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className={inputClassName}
            placeholder="dirigente@ejemplo.com"
          />
          <p className="text-xs text-zinc-500">
            Solo hace falta si prefiere iniciar sesión con correo en vez de DNI.
          </p>
        </div>
      ) : null}

      {state.error ? (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}
      {showSuccess ? (
        <p role="status" className="text-sm text-green-700">
          ✅ Dirigente agregado correctamente.
        </p>
      ) : null}

      {state.success && state.whatsappLink && !linkDismissed ? (
        <a
          href={state.whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setLinkDismissed(true)}
          className="flex h-12 items-center justify-center rounded-lg bg-green-600 text-base font-semibold text-white transition-colors hover:bg-green-700"
        >
          📱 Enviar acceso por WhatsApp
        </a>
      ) : null}

      {state.success && state.accessLink && !state.whatsappLink && !linkDismissed ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-zinc-700">
            Cargá un teléfono la próxima vez para poder mandarlo por WhatsApp. Por ahora, copiá
            este link y envialo como puedas:
          </p>
          <input
            readOnly
            value={state.accessLink}
            onFocus={(event) => event.currentTarget.select()}
            className="h-12 rounded-lg border border-zinc-300 px-4 text-sm text-zinc-700"
          />
          <button
            type="button"
            onClick={() => setLinkDismissed(true)}
            className="h-10 rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Listo, ya lo envié
          </button>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-lg bg-zinc-900 text-base font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar dirigente"}
      </button>
    </form>
  );
}
