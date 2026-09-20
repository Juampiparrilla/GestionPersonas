"use client";

import { ClipboardList, DatabaseBackup, FileText, House, LogOut, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { ENTITY_ICON } from "@/components/ui/entityIcons";
import { Logo } from "@/components/ui/Logo";
import { logout } from "@/lib/auth-actions";

import { useShellUrl } from "./ShellContext";

export type SidebarCounts = { leaders: number; pointers: number; people: number; vehicles: number };

type Item = {
  href: string;
  label: string;
  icon: typeof House;
  count?: number;
};

function NavItem({ item, active }: { item: Item; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex h-[38px] items-center gap-3 rounded-[10px] px-3 text-sm transition-colors duration-150 ease-out ${
        active ? "bg-muted font-semibold text-ink" : "text-ink-label hover:bg-muted/60"
      }`}
    >
      <Icon
        className={`h-[18px] w-[18px] ${active ? "text-ink" : "text-[#a3a3a8]"}`}
        strokeWidth={active ? 2 : 1.75}
        aria-hidden="true"
      />
      <span className="flex-1">{item.label}</span>
      {item.count !== undefined ? (
        <span className="font-mono text-[12px] font-medium text-ink-2">{item.count}</span>
      ) : null}
    </Link>
  );
}

function AccountMenu({ fullName, roleLabel }: { fullName: string; roleLabel: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={ref} className="relative mt-auto border-t border-line pt-3">
      {open ? (
        <div className="absolute inset-x-0 bottom-full mb-2 overflow-hidden rounded-2xl border border-line bg-surface">
          <Link
            href="/mi-cuenta"
            className="flex min-h-[44px] items-center gap-3 px-4 text-sm font-medium text-ink hover:bg-muted"
          >
            <Settings className="h-[18px] w-[18px] text-ink-2" strokeWidth={1.75} aria-hidden="true" />
            Mi cuenta
          </Link>
          <form action={logout} className="border-t border-line-inner">
            <button
              type="submit"
              className="flex min-h-[44px] w-full items-center gap-3 px-4 text-sm font-medium text-err-text hover:bg-err-bg"
            >
              <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
              Cerrar sesión
            </button>
          </form>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 rounded-[10px] p-1.5 text-left hover:bg-muted"
      >
        <Avatar name={fullName} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold text-ink">{fullName}</span>
          <span className="block truncate text-[11px] text-ink-2">{roleLabel}</span>
        </span>
      </button>
    </div>
  );
}

// Barra lateral fija de 236px: reemplaza a la barra de navegacion de abajo.
// La accion primaria ("Cargar registro") pasa al tope.
export function Sidebar({
  counts,
  fullName,
  roleLabel,
}: {
  counts: SidebarCounts;
  fullName: string;
  roleLabel: string;
}) {
  const pathname = usePathname();
  const { openCarga } = useShellUrl();

  const entities: Item[] = [
    { href: "/superadmin", label: "Inicio", icon: House },
    { href: "/superadmin/dirigentes", label: "Dirigentes", icon: ENTITY_ICON.leader, count: counts.leaders },
    { href: "/superadmin/punteros", label: "Punteros", icon: ENTITY_ICON.pointer, count: counts.pointers },
    { href: "/superadmin/personas", label: "Personas", icon: ENTITY_ICON.person, count: counts.people },
    { href: "/superadmin/vehiculos", label: "Vehículos", icon: ENTITY_ICON.vehicle, count: counts.vehicles },
  ];
  const tools: Item[] = [
    { href: "/superadmin/reportes", label: "Reportes", icon: FileText },
    { href: "/superadmin/auditoria", label: "Auditoría", icon: ClipboardList },
    { href: "/superadmin/respaldos", label: "Respaldos", icon: DatabaseBackup },
  ];

  function isActive(href: string): boolean {
    if (href === "/superadmin") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="hidden w-[236px] shrink-0 flex-col gap-4 border-r border-line bg-bar px-3.5 py-5 lg:sticky lg:top-0 lg:flex lg:h-dvh">
      <Link href="/superadmin" className="flex items-center gap-2.5 px-1">
        <Logo size={34} />
        <span className="text-[15px] font-semibold leading-tight text-ink">
          Gestión de
          <br />
          Personas
        </span>
      </Link>

      <button
        type="button"
        onClick={() => openCarga("pointer")}
        className="flex h-10 items-center justify-center gap-2 rounded-[11px] bg-accent text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-accent-press"
      >
        <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        Cargar registro
        <kbd className="font-mono text-[11px] font-medium opacity-70">N</kbd>
      </button>

      <nav aria-label="Navegación principal" className="flex flex-col gap-0.5">
        {entities.map((item) => (
          <NavItem key={item.href} item={item} active={isActive(item.href)} />
        ))}
        <div className="mx-2 my-2 border-t border-line" />
        {tools.map((item) => (
          <NavItem key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </nav>

      <AccountMenu fullName={fullName} roleLabel={roleLabel} />
    </aside>
  );
}
