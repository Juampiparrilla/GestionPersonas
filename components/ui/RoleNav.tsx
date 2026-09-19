"use client";

import { Car, House, Menu, UserRoundCheck, UsersRound } from "lucide-react";

import { BottomNav } from "./BottomNav";

// Las configuraciones de navegacion viven en el cliente porque llevan
// componentes de icono (no se pueden pasar como props desde un Server
// Component).

export function AdminBottomNav() {
  return (
    <BottomNav
      items={[
        { href: "/superadmin", label: "Inicio", icon: House },
        { href: "/superadmin/dirigentes", label: "Dirigentes", icon: UsersRound },
        { href: "/superadmin/punteros", label: "Punteros", icon: UserRoundCheck },
        { href: "/superadmin/vehiculos", label: "Vehículos", icon: Car },
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
        { href: "/dirigente/punteros", label: "Punteros", icon: UsersRound },
        { href: "/dirigente/vehiculos", label: "Vehículos", icon: Car },
        { href: "/dirigente/mas", label: "Más", icon: Menu },
      ]}
    />
  );
}
