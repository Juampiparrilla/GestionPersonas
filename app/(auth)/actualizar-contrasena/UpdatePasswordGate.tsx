"use client";

import { useEffect, useState } from "react";

import { Spinner } from "@/components/Spinner";
import { createClient } from "@/lib/supabase/client";

import { UpdatePasswordForm } from "./UpdatePasswordForm";

type Status = "loading" | "ready" | "expired";

// Los links que genera el Superadmin (invitar / reenviar acceso) llevan el
// token en el FRAGMENTO de la URL (#access_token=...), no en un ?code= --
// eso solo lo puede procesar el cliente en el navegador (el servidor nunca
// ve el fragmento). El cliente de Supabase lo detecta solo apenas se crea
// (detectSessionInUrl), por eso este chequeo es 100% del lado del cliente.
export function UpdatePasswordGate() {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      setStatus(data.session ? "ready" : "expired");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setStatus("ready");
    });

    return () => subscription.unsubscribe();
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
