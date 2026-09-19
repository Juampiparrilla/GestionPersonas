"use client";

import { CircleCheck, Lock, Plus } from "lucide-react";
import { Fragment, useCallback, useEffect, useState } from "react";

import { Sheet } from "./Sheet";
import { btnPrimary } from "./styles";

const SUCCESS_MESSAGE_MS = 4000;

// Boton primario "＋ Agregar X" (va dentro de una <ActionBar>) + la hoja con
// el formulario de alta + el aviso de "listo" flotante. Reemplaza a los
// CollapsibleCreateX: el formulario ya no empuja la lista, y "Guardar y
// cargar otro" (renderForm recibe onCreated(again)) reemplaza a "mantener el
// formulario siempre abierto".
export function CreateSheet({
  triggerLabel,
  title,
  canWrite = true,
  lockedMessage,
  successMessage,
  renderForm,
  variant = "bar",
}: {
  // "bar": boton primario ancho para una <ActionBar>; "header": boton de icono
  // (+) para la cabecera de las pantallas que muestran la barra de navegacion.
  variant?: "bar" | "header";
  triggerLabel: string;
  title: string;
  canWrite?: boolean;
  lockedMessage?: string;
  successMessage: string;
  renderForm: (onCreated: (again: boolean) => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  // Cambia cada alta exitosa: remonta el formulario con los campos vacios
  // (patron recomendado por React en vez de que el hijo se reinicie solo).
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (!showSuccess) return;
    const timeout = setTimeout(() => setShowSuccess(false), SUCCESS_MESSAGE_MS);
    return () => clearTimeout(timeout);
  }, [showSuccess]);

  const handleCreated = useCallback((again: boolean) => {
    setShowSuccess(true);
    setFormKey((key) => key + 1);
    if (!again) {
      setOpen(false);
    }
  }, []);

  const close = useCallback(() => setOpen(false), []);

  if (!canWrite) {
    if (variant === "header") return null;
    return (
      <p className="flex flex-1 items-start gap-2 rounded-[14px] border border-line bg-muted p-3 text-[13px] text-ink-2">
        <Lock className="h-4 w-4 shrink-0 translate-y-0.5" aria-hidden="true" />
        {lockedMessage ??
          "La carga está cerrada en este momento. Podés consultar, pero no agregar ni modificar nada."}
      </p>
    );
  }

  return (
    <>
      {showSuccess ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-[108px] z-[60] mx-auto w-full max-w-[448px] px-5">
          <p
            role="status"
            className="flex animate-[toast-in_0.2s_ease-out] items-center gap-2 rounded-2xl border border-ok-border bg-ok-bg p-3.5 text-[15px] font-semibold text-ok-ink"
          >
            <CircleCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
            {successMessage}
          </p>
        </div>
      ) : null}

      {variant === "header" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={triggerLabel}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white transition-colors duration-150 ease-out active:bg-accent-press"
        >
          <Plus className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
        </button>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className={`${btnPrimary} flex-1`}>
          <Plus className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          {triggerLabel}
        </button>
      )}

      <Sheet open={open} onClose={close} title={title}>
        <Fragment key={formKey}>{renderForm(handleCreated)}</Fragment>
      </Sheet>
    </>
  );
}
