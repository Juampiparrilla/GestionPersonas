"use client";

import { useEffect, useRef } from "react";

import { Spinner } from "@/components/Spinner";

import { btnPrimary, hintClass, labelClass } from "./styles";

export type SubmitIntent = "close" | "again";

// Avisa "se creo" al padre (una vez por alta exitosa) diciendole si se
// apreto "Guardar y cargar otro" (again = true) o el boton primario.
// Devuelve el setter de la intencion, para pasarlo a <FormFooter onIntent>.
export function useCreatedIntent(
  state: { success: boolean },
  onCreated: (again: boolean) => void
): (intent: SubmitIntent) => void {
  const intentRef = useRef<SubmitIntent>("close");

  useEffect(() => {
    if (state.success) {
      onCreated(intentRef.current === "again");
    }
  }, [state, onCreated]);

  return (intent) => {
    intentRef.current = intent;
  };
}

// Campo: label 13/600 a la izquierda y hint "Obligatorio"/"Opcional" a la
// derecha en la misma linea; hint de ayuda o mensaje de error debajo.
export function Field({
  id,
  label,
  required = false,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
        <span className="text-[11px] text-ink-3">{required ? "Obligatorio" : "Opcional"}</span>
      </div>
      {children}
      {hint ? <p className={hintClass}>{hint}</p> : null}
    </div>
  );
}

// Banner de resumen: aparece solo tras un envio fallido.
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-err-border bg-err-bg p-3.5"
    >
      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-err-line" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-err-ink">No se pudo guardar</p>
        <p className="text-sm text-err-ink">{message}</p>
      </div>
    </div>
  );
}

// Pie del formulario, pegado abajo del area scrolleable (hoja o pantalla):
// boton primario de 54px + link "Guardar y cargar otro".
export function FormFooter({
  pending,
  label,
  pendingLabel = "Guardando…",
  showAgain = true,
  onIntent,
}: {
  pending: boolean;
  label: string;
  pendingLabel?: string;
  showAgain?: boolean;
  onIntent?: (intent: SubmitIntent) => void;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-5 mt-auto flex flex-col gap-2 border-t border-line-head bg-bar px-5 pb-[max(26px,env(safe-area-inset-bottom))] pt-3">
      <button
        type="submit"
        disabled={pending}
        onClick={() => onIntent?.("close")}
        className={btnPrimary}
      >
        {pending ? (
          <>
            <Spinner className="h-4 w-4" /> {pendingLabel}
          </>
        ) : (
          label
        )}
      </button>
      {showAgain ? (
        <button
          type="submit"
          disabled={pending}
          onClick={() => onIntent?.("again")}
          className="min-h-[44px] text-[13px] font-medium text-ink-2 disabled:text-disabled-ink"
        >
          Guardar y cargar otro
        </button>
      ) : null}
    </div>
  );
}
