"use client";

import { ChevronDown, CircleCheck, CircleX, X } from "lucide-react";
import { useState } from "react";

import { setGlobalLoadingAction } from "./actions";

export function GlobalLoadingToggle({ loadingEnabled }: { loadingEnabled: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const toggle = setGlobalLoadingAction.bind(null, !loadingEnabled);

  const StatusIcon = loadingEnabled ? CircleCheck : CircleX;
  const statusLabel = loadingEnabled ? "Carga habilitada" : "Carga suspendida";

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 text-left"
      >
        <p className="flex items-center gap-2 font-medium text-zinc-900">
          <StatusIcon
            className={loadingEnabled ? "h-5 w-5 text-green-600" : "h-5 w-5 text-red-600"}
            aria-hidden="true"
          />
          {statusLabel}
        </p>
        <ChevronDown className="h-5 w-5 text-zinc-400" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div className="rounded-xl border-2 border-zinc-300 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-medium text-zinc-900">
          <StatusIcon
            className={loadingEnabled ? "h-5 w-5 text-green-600" : "h-5 w-5 text-red-600"}
            aria-hidden="true"
          />
          {statusLabel}
        </p>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          aria-label="Cerrar"
          className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600">
          {loadingEnabled
            ? "Los dirigentes pueden agregar, editar y quitar información."
            : "Los dirigentes pueden consultar sus datos, pero no modificarlos."}
        </p>
        <form action={toggle}>
          <button
            type="submit"
            className="h-12 w-full rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-100 sm:w-auto"
          >
            {loadingEnabled ? "Cerrar carga para todos" : "Habilitar carga"}
          </button>
        </form>
      </div>
    </div>
  );
}
