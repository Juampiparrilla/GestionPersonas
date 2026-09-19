"use client";

import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; icon: LucideIcon };

// Barra de navegacion global: Inicio · Dirigentes · [+] · Reportes · Más.
// El "+" central (FAB) es la unica accion elevada de la app. Las pantallas
// con accion primaria propia usan <ActionBar> en su lugar: nunca se apilan.
export function BottomNav({
  items,
  fab,
}: {
  items: NavItem[];
  fab?: { href: string; label: string };
}) {
  const pathname = usePathname();

  // Con FAB, este se intercala en el medio de los items (2 + FAB + resto).
  const half = Math.ceil(items.length / 2);
  const left = fab ? items.slice(0, half) : items;
  const right = fab ? items.slice(half) : [];

  function renderItem(item: NavItem) {
    const Icon = item.icon;
    const active = pathname === item.href;
    return (
      <li key={item.href} className="flex-1">
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          className="flex min-h-[48px] flex-col items-center justify-center gap-1"
        >
          <Icon
            className={`h-5 w-5 ${active ? "text-ink" : "text-[#a3a3a8]"}`}
            strokeWidth={active ? 2 : 1.75}
            aria-hidden="true"
          />
          <span
            className={`text-[11px] ${active ? "font-semibold text-ink" : "font-normal text-ink-2"}`}
          >
            {item.label}
          </span>
        </Link>
      </li>
    );
  }

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[448px] border-t border-line-head bg-bar px-3 pb-[max(26px,env(safe-area-inset-bottom))] pt-3"
    >
      <ul className="flex items-end">
        {left.map(renderItem)}
        {fab ? (
          <li className="flex flex-1 justify-center">
            <Link
              href={fab.href}
              aria-label={fab.label}
              className="flex h-[58px] w-[58px] items-center justify-center rounded-[20px] bg-accent text-white shadow-fab transition-colors duration-150 ease-out active:bg-accent-press"
            >
              <Plus className="h-[26px] w-[26px]" strokeWidth={2} aria-hidden="true" />
            </Link>
          </li>
        ) : null}
        {right.map(renderItem)}
      </ul>
    </nav>
  );
}
