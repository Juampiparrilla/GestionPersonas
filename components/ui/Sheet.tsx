"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

import { btnIcon } from "./styles";

// Hoja inferior a pantalla casi completa. Reemplaza a los formularios que se
// desplegaban "en linea" arriba de las listas: asi la accion primaria queda
// al alcance del pulgar y el formulario no empuja el contenido.
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[94dvh] w-full max-w-[448px] animate-[sheet-up_0.2s_ease-out] flex-col rounded-t-[22px] bg-app"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line-head px-5 pb-3 pt-4">
          <h2 className="text-[21px] font-semibold tracking-[-0.015em] text-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className={btnIcon}>
            <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pt-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
