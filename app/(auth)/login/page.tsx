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
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">Gestión de Personas</h1>
        <p className="text-zinc-600">Iniciá sesión para continuar.</p>
      </div>
      <LoginForm />
    </>
  );
}
