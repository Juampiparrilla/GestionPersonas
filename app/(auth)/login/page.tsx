import { redirect } from "next/navigation";

import { Logo } from "@/components/ui/Logo";
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
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3.5">
          <Logo />
          <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">
            Gestión de
            <br />
            Personas
          </h1>
        </div>
        <p className="text-[15px] text-ink-2">Iniciá sesión para continuar.</p>
      </div>
      <LoginForm />
    </>
  );
}
