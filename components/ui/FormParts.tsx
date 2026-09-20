"use client";

import { Pin } from "lucide-react";
import Link from "next/link";
import { createContext, useContext, useEffect, useRef } from "react";

import { Spinner } from "@/components/Spinner";

import { Avatar } from "./Avatar";
import { useSheetClose } from "./Sheet";
import { btnPrimary, hintClass, labelClass } from "./styles";

export type SubmitIntent = "close" | "again";

// Modo "cargar varios" del panel de carga de escritorio: si el panel lo
// provee, el pie del formulario muestra el interruptor para anclar el panel
// (queda abierto y con el formulario vacio despues de guardar).
const KeepOpenContext = createContext<{ value: boolean; onChange: (value: boolean) => void } | null>(null);
export const KeepOpenProvider = KeepOpenContext.Provider;

// Con el panel anclado el formulario se vacia (se remonta) y el foco se
// pierde: lo devuelve al primer campo para seguir cargando con el teclado.
export function focusFirstField() {
  setTimeout(() => {
    document
      .querySelector<HTMLElement>(
        '[role="dialog"] form :is(input:not([type="hidden"]), select, textarea)'
      )
      ?.focus();
  }, 60);
}

function KeepOpenToggle() {
  const keepOpen = useContext(KeepOpenContext);
  if (!keepOpen) return null;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={keepOpen.value}
      onClick={() => keepOpen.onChange(!keepOpen.value)}
      title="Deja el panel abierto después de guardar, para cargar varios seguidos"
      className={`hidden h-[46px] items-center gap-2 rounded-[15px] border px-3.5 text-sm font-semibold transition-colors lg:flex ${
        keepOpen.value
          ? "border-accent bg-row-selected text-accent"
          : "border-line-input bg-surface text-ink-2 hover:text-ink"
      }`}
    >
      <Pin className={`h-4 w-4 ${keepOpen.value ? "fill-current" : ""}`} strokeWidth={1.75} aria-hidden="true" />
      Cargar varios
    </button>
  );
}

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
  wide = false,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  tag?: string;
  // Escritorio: el campo ocupa las dos columnas del formulario.
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${wide ? "lg:col-span-2" : ""}`}>
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
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 lg:col-span-2">
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

// Pie del formulario, pegado abajo del area scrolleable (hoja o pantalla).
// Movil: boton primario de 54px + link "Guardar y cargar otro". Escritorio:
// "Cancelar" a la izquierda; a la derecha "Guardar y cargar otro" (secundario)
// y el primario con el atajo ⌘↵ / Ctrl+Enter. Deshabilitado mientras haya
// errores pendientes o falten campos obligatorios.
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
  const closeSheet = useSheetClose();
  const primaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        if (!primaryRef.current?.disabled) primaryRef.current?.click();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="sticky bottom-0 z-10 -mx-5 mt-auto flex flex-col gap-2 border-t border-line-head bg-bar px-5 pb-[max(26px,env(safe-area-inset-bottom))] pt-3 lg:-mx-[26px] lg:flex-row-reverse lg:items-center lg:gap-3 lg:px-[26px] lg:pb-5 lg:pt-4">
      <button
        ref={primaryRef}
        type="submit"
        disabled={blocked}
        onClick={() => onIntent?.("close")}
        className={`${btnPrimary} lg:h-[46px] lg:w-auto lg:px-5 lg:text-[15px]`}
      >
        {pending ? (
          <>
            <Spinner className="h-4 w-4" /> {pendingLabel}
          </>
        ) : (
          <>
            {label}
            <kbd className="hidden font-mono text-[11px] font-medium opacity-70 lg:inline">⌘↵</kbd>
          </>
        )}
      </button>
      <KeepOpenToggle />
      {showAgain ? (
        <button
          type="submit"
          disabled={blocked}
          onClick={() => onIntent?.("again")}
          className="min-h-[44px] text-[13px] font-medium text-ink-2 disabled:text-disabled-ink lg:h-[46px] lg:rounded-[15px] lg:border lg:border-ink lg:bg-surface lg:px-4 lg:text-sm lg:font-semibold lg:text-ink lg:disabled:border-line-input"
        >
          Guardar y cargar otro
        </button>
      ) : null}
      {closeSheet ? (
        <button
          type="button"
          onClick={closeSheet}
          className="hidden text-sm font-medium text-ink-2 hover:text-ink lg:mr-auto lg:block"
        >
          Cancelar
        </button>
      ) : null}
    </div>
  );
}
