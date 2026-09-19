"use client";

import { useCallback, useState } from "react";

import { Sheet } from "@/components/ui/Sheet";
import { btnSecondaryStrong } from "@/components/ui/styles";

import { setGlobalLoadingAction } from "./actions";

// Banner de estado de la carga (verde = habilitada, rojo = suspendida). Al
// tocarlo se abre la hoja con la explicacion y el boton para cambiarla.
export function GlobalLoadingToggle({ loadingEnabled }: { loadingEnabled: boolean }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const toggle = setGlobalLoadingAction.bind(null, !loadingEnabled);

  const statusLabel = loadingEnabled ? "Carga habilitada" : "Carga suspendida";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-[11px] text-left ${
          loadingEnabled
            ? "border-ok-border bg-ok-bg text-ok-ink"
            : "border-err-border bg-err-bg text-err-ink"
        }`}
      >
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${loadingEnabled ? "bg-ok-dot" : "bg-err-line"}`}
          aria-hidden="true"
        />
        <span className="flex-1 text-sm font-semibold">{statusLabel}</span>
        <span className="text-[13px] font-medium underline underline-offset-2">Cambiar</span>
      </button>

      <Sheet open={open} onClose={close} title={statusLabel}>
        <div className="flex flex-col gap-4 pb-8">
          <p className="text-[15px] text-ink-label">
            {loadingEnabled
              ? "Los dirigentes pueden agregar, editar y quitar información."
              : "Los dirigentes pueden consultar sus datos, pero no modificarlos."}
          </p>
          <form action={toggle}>
            <button type="submit" className={btnSecondaryStrong}>
              {loadingEnabled ? "Cerrar carga para todos" : "Habilitar carga"}
            </button>
          </form>
        </div>
      </Sheet>
    </>
  );
}
