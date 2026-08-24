"use client";

import { useEffect, useState } from "react";

import { Spinner } from "@/components/Spinner";
import { createClient } from "@/lib/supabase/client";

import { UpdatePasswordForm } from "./UpdatePasswordForm";

type Status = "loading" | "ready" | "expired";

// Los links que genera el Superadmin (invitar / reenviar acceso) NO pasan
// por /auth/callback como el resto de la app: pueden llegar con el token en
// un ?code= (PKCE) o en el FRAGMENTO de la URL (#access_token=..., que un
// servidor nunca puede leer). Este componente prueba las dos formas del
// lado del cliente, sin asumir cual usa el proyecto.
export function UpdatePasswordGate() {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function resolveSession() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (!error) {
          window.history.replaceState({}, "", url.pathname);
          setStatus("ready");
          return;
        }
      }

      // Si no habia ?code= (o fallo), puede que el token venga en el
      // fragmento: el cliente lo detecta solo al crearse (detectSessionInUrl).
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setStatus(data.session ? "ready" : "expired");
    }

    resolveSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setStatus("ready");
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center gap-3 text-zinc-600">
        <Spinner className="h-6 w-6" />
        <p>Verificando el link…</p>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">Link vencido</h1>
        <p className="max-w-sm text-zinc-600">
          Este link ya no es válido. Pedile a la persona que administra el sistema que te
          reenvíe el acceso.
        </p>
        <a href="/login" className="text-sm text-zinc-600 underline underline-offset-2">
          Volver
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">Elegí una nueva contraseña</h1>
      </div>
      <UpdatePasswordForm />
    </>
  );
}
