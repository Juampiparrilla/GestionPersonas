"use client";

import { ChevronDown, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { btnIcon } from "@/components/ui/styles";
import { logout } from "@/lib/auth-actions";

// Menu de cuenta de la cabecera del Inicio: Mi cuenta / Cerrar sesión.
export function AccountMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Menú de cuenta"
        aria-expanded={open}
        className={btnIcon}
      >
        <ChevronDown className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-12 z-40 w-52 overflow-hidden rounded-2xl border border-line bg-surface"
        >
          <Link
            href="/mi-cuenta"
            role="menuitem"
            className="flex min-h-[48px] items-center gap-3 px-4 text-[15px] font-medium text-ink active:bg-muted"
          >
            <Settings className="h-[18px] w-[18px] text-ink-2" strokeWidth={1.75} aria-hidden="true" />
            Mi cuenta
          </Link>
          <form action={logout} className="border-t border-line-inner">
            <button
              type="submit"
              role="menuitem"
              className="flex min-h-[48px] w-full items-center gap-3 px-4 text-[15px] font-medium text-err-text active:bg-err-bg"
            >
              <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
              Cerrar sesión
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
