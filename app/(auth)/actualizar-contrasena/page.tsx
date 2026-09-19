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
      <div className="flex flex-col gap-3">
        <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">
          Link vencido
        </h1>
        <p className="text-[15px] text-ink-2">
          Este link ya no es válido. Pedile a la persona que administra el sistema que te
          reenvíe el acceso.
        </p>
        <a href="/login" className="inline-flex min-h-[44px] items-center text-sm font-medium text-link">
          Volver
        </a>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">
        Elegí una nueva contraseña
      </h1>
      <UpdatePasswordForm />
    </>
  );
}
