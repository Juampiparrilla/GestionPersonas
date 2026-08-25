import { UsersRound } from "lucide-react";
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
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900">
          <UsersRound className="h-6 w-6 text-white" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-zinc-900">Gestión de Personas</h1>
          <p className="text-zinc-600">Iniciá sesión para continuar.</p>
        </div>
      </div>
      <LoginForm />
    </>
  );
}
