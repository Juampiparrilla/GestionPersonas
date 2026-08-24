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
    if (nextPinned) setOpen(true);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-14 items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 text-base font-semibold text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50"
      >
        + Agregar dirigente
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
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
      {!pinned ? (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="self-start text-sm text-zinc-600 underline underline-offset-2"
        >
          Cerrar
        </button>
      ) : null}
    </div>
  );
}
