"use client";

import { useCallback, useEffect, useState } from "react";

import { CreatePersonForm } from "./CreatePersonForm";

const SUCCESS_MESSAGE_MS = 4000;

export function CollapsibleCreatePerson({
  pointerId,
  canWrite,
  onOpenChange,
  closeSignal,
}: {
  pointerId: string;
  canWrite: boolean;
  onOpenChange?: (open: boolean) => void;
  closeSignal?: number;
}) {
  const [open, setOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  const [handledCloseSignal, setHandledCloseSignal] = useState(closeSignal);
  if (closeSignal !== handledCloseSignal) {
    setHandledCloseSignal(closeSignal);
    if (closeSignal !== undefined) {
      setOpen(false);
    }
  }

  useEffect(() => {
    if (!showSuccess) return;
    const timeout = setTimeout(() => setShowSuccess(false), SUCCESS_MESSAGE_MS);
    return () => clearTimeout(timeout);
  }, [showSuccess]);

  const handleCreated = useCallback(() => {
    setShowSuccess(true);
    setFormKey((key) => key + 1);
    setOpen(false);
  }, []);

  if (!canWrite) {
    return (
      <p className="rounded-lg bg-zinc-100 p-3 text-sm text-zinc-600">
        🔒 La carga está cerrada en este momento. Podés consultar, pero no agregar ni modificar
        nada.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {showSuccess ? (
        <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          ✅ Persona agregada correctamente.
        </p>
      ) : null}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-12 items-center justify-center rounded-lg bg-zinc-900 text-base font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          👤+ Agregar persona
        </button>
      ) : (
        <div className="flex flex-col gap-3 rounded-xl border-2 border-zinc-300 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-zinc-900">Agregar persona</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            >
              ✕
            </button>
          </div>

          <CreatePersonForm key={formKey} pointerId={pointerId} onCreated={handleCreated} />
        </div>
      )}
    </div>
  );
}
