"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext } from "react";
import { createPortal } from "react-dom";

// Contexto del armazon de escritorio del Administrador: donde se enganchan
// las acciones de la barra superior, y el estado en la URL (paneles de
// detalle y de carga), para poder compartir enlaces y usar el boton "atras".

export type CargaType = "pointer" | "person" | "vehicle";
export const CARGA_TYPES: CargaType[] = ["pointer", "person", "vehicle"];

type ShellContextValue = {
  topbarActionsTarget: HTMLElement | null;
};

export const ShellContext = createContext<ShellContextValue>({ topbarActionsTarget: null });

// Renderiza `children` dentro de la barra superior de escritorio (a la
// derecha). En movil no hay barra superior: no renderiza nada.
export function TopbarActions({ children }: { children: React.ReactNode }) {
  const { topbarActionsTarget } = useContext(ShellContext);
  if (!topbarActionsTarget) return null;
  return createPortal(children, topbarActionsTarget);
}

// Parametros de la URL que el armazon entiende:
//   ?cargar=pointer|person|vehicle  (&dirigente=<id> | &puntero=<id>)  -> panel de carga
//   ?detalle=<id>                                       -> panel de detalle
export function useShellUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParams = useCallback(
    (changes: Record<string, string | null>, { replace = false } = {}) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === null) next.delete(key);
        else next.set(key, value);
      }
      const query = next.toString();
      const url = query ? `${pathname}?${query}` : pathname;
      if (replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const cargarParam = searchParams.get("cargar");
  const cargar = CARGA_TYPES.find((type) => type === cargarParam) ?? null;

  return {
    searchParams,
    setParams,
    cargar,
    cargarLeaderId: searchParams.get("dirigente"),
    cargarPointerId: searchParams.get("puntero"),
    detalleId: searchParams.get("detalle"),
    openCarga: (type: CargaType = "pointer", leaderId?: string, pointerId?: string) =>
      setParams({ cargar: type, dirigente: leaderId ?? null, puntero: pointerId ?? null }),
    closeCarga: () =>
      setParams({ cargar: null, dirigente: null, puntero: null }, { replace: true }),
    selectDetalle: (id: string | null) => setParams({ detalle: id }, { replace: true }),
  };
}
