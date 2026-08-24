"use client";

import { useState } from "react";

import { CreateLeaderForm } from "./CreateLeaderForm";

const PIN_STORAGE_KEY = "gestion-personas:dirigentes:formAbierto";

function readPinned(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PIN_STORAGE_KEY) === "true";
}

export function CollapsibleCreateLeader() {
  // Arranca cerrado; si esta "fijado" (guardado en este navegador), arranca
  // abierto directamente la proxima vez que se entre a esta pantalla.
  const [pinned, setPinned] = useState(readPinned);
  const [open, setOpen] = useState(readPinned);

  function togglePinned(nextPinned: boolean) {
    setPinned(nextPinned);
    localStorage.setItem(PIN_STORAGE_KEY, String(nextPinned));
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 items-center justify-center rounded-lg bg-zinc-900 text-base font-semibold text-white transition-colors hover:bg-zinc-800"
      >
        + Agregar dirigente
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border-2 border-zinc-300 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-zinc-900">Agregar dirigente</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar"
          className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
        >
          ✕
        </button>
      </div>

      <CreateLeaderForm />

      <label className="flex items-center gap-2 self-start text-sm text-zinc-600">
        <input
          type="checkbox"
          checked={pinned}
          onChange={(event) => togglePinned(event.target.checked)}
          className="h-4 w-4 rounded border-zinc-300"
        />
        📌 Mantener este formulario siempre abierto
      </label>
    </div>
  );
}
