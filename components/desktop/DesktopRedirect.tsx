"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// En escritorio (>= 1024px) algunas pantallas del movil no existen como tal
// (la ficha de un puntero, el menu "Mas"): la informacion vive en un panel o
// en la barra lateral. Si alguien llega ahi por un enlace, lo lleva a su lugar.
export function DesktopRedirect({ to }: { to: string }) {
  const router = useRouter();

  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      router.replace(to);
    }
  }, [router, to]);

  return null;
}
