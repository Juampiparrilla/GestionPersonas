import { redirect } from "next/navigation";

import { roleHomePath } from "@/lib/routes";
import { getSessionContext } from "@/lib/session";

import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const session = await getSessionContext();
  if (session) {
    redirect(roleHomePath(session.role));
  }

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* Marcador del logo: reemplazar por el logo real de la organizacion
            manteniendo la caja de 56x56 y el radio de 16. */}
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink">
          <span className="font-mono text-[22px] font-semibold text-app">GP</span>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">
            Gestión de
            <br />
            Personas
          </h1>
          <p className="text-[15px] text-ink-2">Iniciá sesión para continuar.</p>
        </div>
      </div>
      <LoginForm />
    </>
  );
}
