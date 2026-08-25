"use client";

import { useState } from "react";

import { setGlobalLoadingAction } from "./actions";

export function GlobalLoadingToggle({ loadingEnabled }: { loadingEnabled: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const toggle = setGlobalLoadingAction.bind(null, !loadingEnabled);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 text-left"
      >
        <p className="font-medium text-zinc-900">
          {loadingEnabled ? "🟢 Carga habilitada" : "🔴 Carga cerrada"}
        </p>
        <span className="text-lg text-zinc-400">▼</span>
      </button>
    );
  }

  return (
    <div className="rounded-xl border-2 border-zinc-300 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="font-medium text-zinc-900">
          {loadingEnabled ? "🟢 Carga habilitada" : "🔴 Carga cerrada"}
        </p>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          aria-label="Cerrar"
          className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
        >
          ✕
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600">
          {loadingEnabled
            ? "Los dirigentes pueden agregar y editar información."
            : "Los dirigentes solo pueden consultar, no pueden agregar ni editar nada."}
        </p>
        <form action={toggle}>
          <button
            type="submit"
            className="h-12 w-full rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-100 sm:w-auto"
          >
            {loadingEnabled ? "🔒 Cerrar carga" : "🔓 Habilitar carga"}
          </button>
        </form>
      </div>
    </div>
  );
}
