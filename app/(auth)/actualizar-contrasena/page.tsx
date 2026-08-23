import { getSessionContext } from "@/lib/session";

import { UpdatePasswordForm } from "./UpdatePasswordForm";

export default async function UpdatePasswordPage() {
  const session = await getSessionContext();

  if (!session) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">Link vencido</h1>
        <p className="max-w-sm text-zinc-600">
          Este link ya no es válido. Pedí uno nuevo desde la pantalla de recuperación.
        </p>
        <a
          href="/recuperar-contrasena"
          className="text-sm text-zinc-600 underline underline-offset-2"
        >
          Volver a recuperar contraseña
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
