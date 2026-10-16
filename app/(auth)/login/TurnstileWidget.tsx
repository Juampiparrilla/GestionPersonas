"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";

type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

// Widget de Cloudflare Turnstile. Pone el token en un input oculto
// "cf-turnstile-response" dentro del formulario. `resetKey` cambia despues de
// cada intento para pedir un token nuevo (cada token sirve una sola vez).
export function TurnstileWidget({ resetKey }: { resetKey: unknown }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const render = useCallback(() => {
    if (!siteKey || !containerRef.current || !window.turnstile || widgetIdRef.current) return;
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      language: "es",
    });
  }, [siteKey]);

  useEffect(() => {
    render();
  }, [render]);

  useEffect(() => {
    if (widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current);
  }, [resetKey]);

  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={render}
      />
      <div ref={containerRef} className="flex min-h-[65px] justify-center" />
    </>
  );
}
