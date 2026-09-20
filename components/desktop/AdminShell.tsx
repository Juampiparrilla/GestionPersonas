"use client";

import { CargaPanelHost } from "./CargaPanel";
import { GlobalSearch } from "./GlobalSearch";
import { useShellUrl } from "./ShellContext";
import { ShellFrame } from "./ShellFrame";
import { Sidebar, type SidebarCounts } from "./Sidebar";

// Armazon de escritorio del Administrador de Organizacion.
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
  const { openCarga } = useShellUrl();

  return (
    <>
      <ShellFrame
        sidebar={<Sidebar counts={counts} fullName={fullName} roleLabel={roleLabel} />}
        topbarLeft={<GlobalSearch />}
        onNew={() => openCarga("pointer")}
      >
        {children}
      </ShellFrame>
      <CargaPanelHost />
    </>
  );
}
