"use client";

import { Car, CircleCheck, Lock, Pin, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { CreateVehicleForm } from "./CreateVehicleForm";

const PIN_STORAGE_KEY = "gestion-personas:vehiculos:formAbierto";
const SUCCESS_MESSAGE_MS = 4000;

function readPinned(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PIN_STORAGE_KEY) === "true";
}

export function CollapsibleCreateVehicle({
  canWrite,
  onOpenChange,
  closeSignal,
}: {
  canWrite: boolean;
  onOpenChange?: (open: boolean) => void;
  closeSignal?: number;
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
        La carga está cerrada en este momento. Podés consultar tus vehículos, pero no agregar
        ni modificar nada.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {showSuccess ? (
        <p role="status" className="flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          <CircleCheck className="h-4 w-4 shrink-0 translate-y-0.5" aria-hidden="true" />
          El vehículo fue agregado exitosamente.
        </p>
      ) : null}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-12 items-center justify-center gap-2 rounded-lg bg-zinc-900 text-base font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          <Car className="h-5 w-5" aria-hidden="true" />
          Agregar vehículo
        </button>
      ) : (
        <div className="flex flex-col gap-3 rounded-xl border-2 border-zinc-300 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-zinc-900">Agregar vehículo</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <CreateVehicleForm key={formKey} onCreated={handleCreated} />

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
