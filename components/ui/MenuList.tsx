import { ChevronRight, LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { logout } from "@/lib/auth-actions";

import { cardClass } from "./styles";

export type MenuItem = { href: string; label: string; hint?: string; icon: LucideIcon };

// Tarjeta agrupada de filas (mismo patron que la lista de categorias de
// Reportes): tile de icono 34x34, titulo, subtitulo y chevron.
export function MenuList({ items }: { items: MenuItem[] }) {
  return (
    <div className={`${cardClass} overflow-hidden`}>
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-[13px] px-4 py-[15px] transition-colors duration-150 ease-out active:bg-muted ${
              index > 0 ? "border-t border-line-inner" : ""
            }`}
          >
            <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-muted text-ink-label">
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-base font-semibold text-ink">{item.label}</span>
              {item.hint ? <span className="text-[13px] text-ink-2">{item.hint}</span> : null}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-ph" aria-hidden="true" />
          </Link>
        );
      })}
    </div>
  );
}

export function LogoutRow() {
  return (
    <form action={logout} className={cardClass}>
      <button
        type="submit"
        className="flex min-h-[52px] w-full items-center gap-[13px] rounded-[18px] px-4 py-3 text-left text-base font-semibold text-err-text transition-colors duration-150 ease-out active:bg-err-bg"
      >
        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-err-bg">
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
        </span>
        Cerrar sesión
      </button>
    </form>
  );
}
