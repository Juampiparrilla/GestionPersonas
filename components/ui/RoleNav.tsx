"use client";

import { Building2, ClipboardList, House, Menu } from "lucide-react";

import { ENTITY_ICON } from "./entityIcons";

import { BottomNav } from "./BottomNav";

// Las configuraciones de navegacion viven en el cliente porque llevan
// componentes de icono (no se pueden pasar como props desde un Server
// Component).

export function AdminBottomNav() {
  return (
    <BottomNav
      items={[
        { href: "/superadmin", label: "Inicio", icon: House },
        { href: "/superadmin/dirigentes", label: "Dirigentes", icon: ENTITY_ICON.leader },
        { href: "/superadmin/punteros", label: "Punteros", icon: ENTITY_ICON.pointer },
        { href: "/superadmin/personas", label: "Personas", icon: ENTITY_ICON.person },
        { href: "/superadmin/vehiculos", label: "Vehículos", icon: ENTITY_ICON.vehicle },
        { href: "/superadmin/mas", label: "Más", icon: Menu },
      ]}
    />
  );
}

export function LeaderBottomNav() {
  return (
    <BottomNav
      items={[
        { href: "/dirigente", label: "Inicio", icon: House },
        { href: "/dirigente/punteros", label: "Punteros", icon: ENTITY_ICON.pointer },
        { href: "/dirigente/vehiculos", label: "Vehículos", icon: ENTITY_ICON.vehicle },
        { href: "/dirigente/mas", label: "Más", icon: Menu },
      ]}
    />
  );
}

export function PlatformBottomNav() {
  return (
    <BottomNav
      items={[
        { href: "/plataforma", label: "Organizaciones", icon: Building2 },
        { href: "/plataforma/auditoria", label: "Auditoría", icon: ClipboardList },
        { href: "/plataforma/mas", label: "Más", icon: Menu },
      ]}
    />
  );
}
