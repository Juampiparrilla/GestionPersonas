"use client";

import { useEffect, useMemo, useState } from "react";

import { ShellContext } from "./ShellContext";

// Armazon de escritorio (>= 1024px) comun a los roles que lo tienen: barra
// lateral + barra superior (con un hueco a la izquierda y otro a la derecha
// para las acciones de cada pantalla) + contenido. En movil no muestra nada
// de esto y las pantallas se ven como siempre (barra de navegacion inferior).
//
// `onNew` es el atajo "N" (abre la carga), salvo que se este escribiendo o ya
// haya un panel abierto.
export function ShellFrame({
  sidebar,
  topbarLeft,
  onNew,
  children,
}: {
  sidebar: React.ReactNode;
  topbarLeft?: React.ReactNode;
  onNew?: () => void;
  children: React.ReactNode;
}) {
  const [actionsTarget, setActionsTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!onNew) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "n" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (typing || document.querySelector("[role=dialog]")) return;
      event.preventDefault();
      onNew?.();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onNew]);

  const contextValue = useMemo(() => ({ topbarActionsTarget: actionsTarget }), [actionsTarget]);

  return (
    <ShellContext.Provider value={contextValue}>
      <div className="flex flex-1 flex-col lg:flex-row">
        {sidebar}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 hidden h-[60px] shrink-0 items-center gap-4 border-b border-line bg-bar px-6 lg:flex">
            {topbarLeft}
            <div ref={setActionsTarget} className="ml-auto flex items-center gap-2.5" />
          </header>
          {children}
        </div>
      </div>
    </ShellContext.Provider>
  );
}
