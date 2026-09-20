"use client";

import { CircleCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const TOAST_MS = 4000;

// Aviso de "listo" flotante para escritorio, abajo a la derecha: se usa
// cuando el panel de carga se cierra solo despues de guardar.
export function useDeskToast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => setMessage(null), TOAST_MS);
    return () => clearTimeout(timeout);
  }, [message]);

  const show = useCallback((text: string) => setMessage(text), []);

  const toast = message ? (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[60] hidden lg:block">
      <p
        role="status"
        className="flex animate-[toast-in_0.2s_ease-out] items-center gap-2 rounded-2xl border border-ok-border bg-ok-bg px-4 py-3 text-[15px] font-semibold text-ok-ink shadow-panel"
      >
        <CircleCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
        {message}
      </p>
    </div>
  ) : null;

  return { toast, show };
}
