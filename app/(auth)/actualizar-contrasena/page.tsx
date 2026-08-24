import { getSessionContext } from "@/lib/session";

import { UpdatePasswordForm } from "./UpdatePasswordForm";

// La verificacion del token pasa por app/auth/verify/route.ts (un Route
// Handler, que a diferencia de este Server Component SI puede escribir la
// cookie de sesion) antes de llegar aca -- esta pantalla solo confirma que
// ya hay una sesion activa.
export default async function UpdatePasswordPage() {
  const session = await getSessionContext();

  if (!session) {
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
