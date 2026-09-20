"use client";

import { useEffect, useMemo, useState } from "react";

import { CargaPanelHost } from "./CargaPanel";
import { GlobalSearch } from "./GlobalSearch";
import { ShellContext, useShellUrl } from "./ShellContext";
import { Sidebar, type SidebarCounts } from "./Sidebar";

// Armazon de escritorio (>= 1024px) del Administrador de Organizacion:
// barra lateral + barra superior + contenido. En movil no muestra nada de
// esto y las pantallas se ven como siempre (barra de navegacion inferior).
export function AdminShell({
  counts,
  fullName,
  roleLabel,
  children,
}: {
  counts: SidebarCounts;
  fullName: string;
  roleLabel: string;
  children: React.ReactNode;
}) {
  const [actionsTarget, setActionsTarget] = useState<HTMLElement | null>(null);
  const { openCarga } = useShellUrl();

  // Atajo "N": abre el panel de carga (salvo que se este escribiendo).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "n" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const typing =
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable);
      if (typing || document.querySelector("[role=dialog]")) return;
      event.preventDefault();
      openCarga("pointer");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openCarga]);

  const contextValue = useMemo(() => ({ topbarActionsTarget: actionsTarget }), [actionsTarget]);

  return (
    <ShellContext.Provider value={contextValue}>
      <div className="flex flex-1 flex-col lg:flex-row">
        <Sidebar counts={counts} fullName={fullName} roleLabel={roleLabel} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 hidden h-[60px] shrink-0 items-center gap-4 border-b border-line bg-bar px-6 lg:flex">
            <GlobalSearch />
            <div ref={setActionsTarget} className="ml-auto flex items-center gap-2.5" />
          </header>
          {children}
        </div>
      </div>
      <CargaPanelHost />
    </ShellContext.Provider>
  );
}
