"use client";

import { House } from "lucide-react";

import { ENTITY_ICON } from "@/components/ui/entityIcons";

import { LeaderCargaPanelHost } from "./LeaderCargaPanel";
import { useShellUrl } from "./ShellContext";
import { ShellFrame } from "./ShellFrame";
import { SidebarFrame } from "./Sidebar";

// Armazon de escritorio del Dirigente: barra lateral con Inicio, Punteros y
// Vehiculos (las personas viven dentro de cada puntero).
export function LeaderShell({
  counts,
  canWrite,
  fullName,
  roleLabel,
  children,
}: {
  counts: { pointers: number; vehicles: number };
  canWrite: boolean;
  fullName: string;
  roleLabel: string;
  children: React.ReactNode;
}) {
  const { openCarga } = useShellUrl();

  return (
    <>
      <ShellFrame
        sidebar={
          <SidebarFrame
            homeHref="/dirigente"
            primary={{
              label: "Cargar registro",
              onClick: () => openCarga("pointer"),
              disabled: !canWrite,
              disabledHint: "La carga está cerrada en este momento.",
            }}
            fullName={fullName}
            roleLabel={roleLabel}
            groups={[
              [
                { href: "/dirigente", label: "Inicio", icon: House },
                { href: "/dirigente/punteros", label: "Punteros", icon: ENTITY_ICON.pointer, count: counts.pointers },
                { href: "/dirigente/vehiculos", label: "Vehículos", icon: ENTITY_ICON.vehicle, count: counts.vehicles },
              ],
            ]}
          />
        }
        onNew={canWrite ? () => openCarga("pointer") : undefined}
      >
        {children}
      </ShellFrame>
      <LeaderCargaPanelHost canWrite={canWrite} />
    </>
  );
}
