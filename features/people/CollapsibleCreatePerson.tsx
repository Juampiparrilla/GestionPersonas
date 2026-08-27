"use client";

import { CircleCheck, Lock, Pin, UserRoundPlus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { CreatePersonForm } from "./CreatePersonForm";

const PIN_STORAGE_KEY = "gestion-personas:personas:formAbierto";
const SUCCESS_MESSAGE_MS = 4000;

function readPinned(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PIN_STORAGE_KEY) === "true";
}

export function CollapsibleCreatePerson({
  pointerId,
  canWrite,
  onOpenChange,
  closeSignal,
  openSignal,
}: {
  pointerId: string;
  canWrite: boolean;
  onOpenChange?: (open: boolean) => void;
  closeSignal?: number;
  openSignal?: number;
}) {
  const [pinned, setPinned] = useState(readPinned);
  const [open, setOpen] = useState(readPinned);
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

  // Mismo patron que closeSignal, pero para abrir el formulario desde
  // afuera -- lo usa el boton "Agregar" que aparece cuando la lista esta
  // vacia (ver PeopleList).
  const [handledOpenSignal, setHandledOpenSignal] = useState(openSignal);
  if (openSignal !== handledOpenSignal) {
    setHandledOpenSignal(openSignal);
    if (openSignal !== undefined) {
      setOpen(true);
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
    if (!pinned) {
      setOpen(false);
    }
  }, [pinned]);

  function togglePinned(nextPinned: boolean) {
    setPinned(nextPinned);
    localStorage.setItem(PIN_STORAGE_KEY, String(nextPinned));
  }

  if (!canWrite) {
    return (
      <p className="flex items-start gap-2 rounded-lg bg-zinc-100 p-3 text-sm text-zinc-600">
        <Lock className="h-4 w-4 shrink-0 translate-y-0.5" aria-hidden="true" />
        La carga está cerrada en este momento. Podés consultar, pero no agregar ni modificar
        nada.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {showSuccess ? (
        <p
          role="status"
          className="flex animate-[toast-in_0.2s_ease-out] items-center gap-2 rounded-lg border-2 border-green-200 bg-green-50 p-4 text-base font-semibold text-green-800 shadow-sm"
        >
          <CircleCheck className="h-6 w-6 shrink-0" aria-hidden="true" />
          Persona agregada correctamente.
        </p>
      ) : null}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-12 items-center justify-center gap-2 rounded-lg bg-zinc-900 text-base font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          <UserRoundPlus className="h-5 w-5" aria-hidden="true" />
          Agregar persona
        </button>
      ) : (
        <div className="flex flex-col gap-3 rounded-xl border-2 border-zinc-300 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-zinc-900">Agregar persona</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <CreatePersonForm key={formKey} pointerId={pointerId} onCreated={handleCreated} />

          <label className="flex items-center gap-2 self-start text-sm text-zinc-600">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(event) => togglePinned(event.target.checked)}
              className="h-4 w-4 rounded border-zinc-300"
            />
            <Pin className="h-4 w-4" aria-hidden="true" />
            Mantener este formulario siempre abierto
          </label>
        </div>
      )}
    </div>
  );
}
