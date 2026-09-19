"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { Spinner } from "@/components/Spinner";

import { Avatar } from "./Avatar";
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
// derecha en la misma linea; debajo, el mensaje de error del campo (si lo
// hay) o el hint de ayuda. `tag` es una etiqueta dentro del campo, a la
// derecha (ej. "DUPLICADO").
export function Field({
  id,
  label,
  required = false,
  hint,
  error,
  tag,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  tag?: string;
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
      <div className="relative">
        {children}
        {tag ? (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-err-text">
            {tag}
          </span>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-[12px] text-err-text">
          {error}
        </p>
      ) : hint ? (
        <p className={hintClass}>{hint}</p>
      ) : null}
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

// Tarjeta del registro existente cuando el DNI ya esta cargado: el error no
// solo bloquea, lleva al registro.
export function ExistingRecordCard({
  name,
  kindLabel,
  loadedOn,
  href,
}: {
  name: string;
  kindLabel: string;
  loadedOn: string;
  href: string | null;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
      <Avatar name={name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">Ya existe: {name}</p>
        <p className="text-[12px] text-ink-2">
          {kindLabel} · cargado el {loadedOn}
        </p>
      </div>
      {href ? (
        <Link href={href} className="flex min-h-[44px] items-center px-1 text-[13px] font-semibold text-link">
          Ver
        </Link>
      ) : null}
    </div>
  );
}

// Pie del formulario, pegado abajo del area scrolleable (hoja o pantalla):
// boton primario de 54px + link "Guardar y cargar otro". Deshabilitado
// mientras haya errores pendientes o falten campos obligatorios.
export function FormFooter({
  pending,
  label,
  pendingLabel = "Guardando…",
  showAgain = true,
  disabled = false,
  onIntent,
}: {
  pending: boolean;
  label: string;
  pendingLabel?: string;
  showAgain?: boolean;
  disabled?: boolean;
  onIntent?: (intent: SubmitIntent) => void;
}) {
  const blocked = pending || disabled;

  return (
    <div className="sticky bottom-0 z-10 -mx-5 mt-auto flex flex-col gap-2 border-t border-line-head bg-bar px-5 pb-[max(26px,env(safe-area-inset-bottom))] pt-3">
      <button
        type="submit"
        disabled={blocked}
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
          disabled={blocked}
          onClick={() => onIntent?.("again")}
          className="min-h-[44px] text-[13px] font-medium text-ink-2 disabled:text-disabled-ink"
        >
          Guardar y cargar otro
        </button>
      ) : null}
    </div>
  );
}
