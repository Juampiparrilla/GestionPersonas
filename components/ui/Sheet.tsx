"use client";

import { X } from "lucide-react";
import { createContext, useContext, useEffect } from "react";
import { createPortal } from "react-dom";

import { btnIcon } from "./styles";

// Permite a un formulario dentro de la hoja cerrarla ("Cancelar" en escritorio).
const SheetContext = createContext<{ close: (() => void) | null }>({ close: null });
export function useSheetClose(): (() => void) | null {
  return useContext(SheetContext).close;
}

// Hoja inferior a pantalla casi completa en movil (reemplaza a los
// formularios que se desplegaban "en linea" arriba de las listas: la accion
// primaria queda al alcance del pulgar). En escritorio (>= 1024px) es un
// panel lateral de 520px anclado a la derecha, con velo detras.
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  // Portal a <body>: asi la hoja siempre queda por encima de la barra de
  // navegacion / accion, sin importar en que contenedor (cabecera fija,
  // barra inferior) se haya montado el boton que la abre.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 lg:items-stretch lg:justify-end lg:bg-scrim"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[94dvh] w-full max-w-[448px] animate-[sheet-up_0.2s_ease-out] flex-col rounded-t-[22px] bg-app lg:max-h-none lg:max-w-[520px] lg:animate-[panel-in_0.2s_ease-out] lg:rounded-none lg:shadow-panel"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line-head px-5 pb-3 pt-4 lg:px-[26px] lg:pb-[18px] lg:pt-[22px]">
          <div className="min-w-0">
            <h2 className="text-[21px] font-semibold tracking-[-0.015em] text-ink">{title}</h2>
            {subtitle ? <p className="mt-1 hidden text-sm text-ink-2 lg:block">{subtitle}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <kbd className="hidden rounded-md border border-line-input bg-surface px-1.5 py-0.5 font-mono text-[11px] text-ink-2 lg:block">
              esc
            </kbd>
            <button type="button" onClick={onClose} aria-label="Cerrar" className={btnIcon}>
              <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        </div>
        <SheetContext.Provider value={{ close: onClose }}>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pt-4 lg:px-[26px] lg:pt-5">
            {children}
          </div>
        </SheetContext.Provider>
      </div>
    </div>,
    document.body
  );
}
