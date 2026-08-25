"use client";

import { CircleCheck, Pin, UserRoundPlus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { CreateLeaderForm } from "./CreateLeaderForm";

const PIN_STORAGE_KEY = "gestion-personas:dirigentes:formAbierto";
const SUCCESS_MESSAGE_MS = 4000;

function readPinned(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PIN_STORAGE_KEY) === "true";
}

export function CollapsibleCreateLeader({
  onOpenChange,
  closeSignal,
}: {
  onOpenChange?: (open: boolean) => void;
  // Cambia (a cualquier valor distinto de undefined) cuando el padre quiere
  // forzar el cierre -- por ejemplo, cuando se empieza a editar un dirigente
  // en la lista. Nunca se crea y se edita al mismo tiempo.
  closeSignal?: number;
}) {
  // Arranca cerrado; si esta "fijado" (guardado en este navegador), arranca
  // abierto directamente la proxima vez que se entre a esta pantalla.
  const [pinned, setPinned] = useState(readPinned);
  const [open, setOpen] = useState(readPinned);
  const [showSuccess, setShowSuccess] = useState(false);
  // Cambia cada alta exitosa; se lo pasamos como `key` a CreateLeaderForm
  // para remontarlo con los campos vacios (patron recomendado por React en
  // vez de que el hijo se reinicie a si mismo).
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  // Patron "ajustar estado durante el render" (en vez de useEffect) para
  // reaccionar a que closeSignal cambio: https://react.dev/learn/you-might-not-need-an-effect
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

  // El mensaje se muestra siempre (esta afuera del formulario que se puede
  // colapsar), y el formulario solo se colapsa si no esta fijado -- asi en
  // los dos casos queda claro que la carga funciono.
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

  return (
    <div className="flex flex-col gap-2">
      {showSuccess ? (
        <p role="status" className="flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          <CircleCheck className="h-4 w-4 shrink-0 translate-y-0.5" aria-hidden="true" />
          El dirigente fue creado exitosamente. Para darle acceso, usá el botón de invitar en su
          fila de la lista.
        </p>
      ) : null}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-12 items-center justify-center gap-2 rounded-lg bg-zinc-900 text-base font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          <UserRoundPlus className="h-5 w-5" aria-hidden="true" />
          Agregar dirigente
        </button>
      ) : (
        <div className="flex flex-col gap-3 rounded-xl border-2 border-zinc-300 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-zinc-900">Agregar dirigente</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <CreateLeaderForm key={formKey} onCreated={handleCreated} />

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
