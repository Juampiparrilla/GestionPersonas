import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { UpdatePasswordForm } from "@/app/(auth)/actualizar-contrasena/UpdatePasswordForm";
import { roleHomePath } from "@/lib/routes";
import { getSessionContext } from "@/lib/session";

// Accesible para cualquier rol logueado (a diferencia de /superadmin,
// /dirigente, /plataforma, que cada uno tiene su propio layout que exige un
// rol especifico) -- cambiar la contraseña de uno mismo no depende del rol.
export default async function MiCuentaPage() {
  const session = await getSessionContext();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col gap-6 bg-zinc-50 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Mi cuenta</h1>
        <Link
          href={roleHomePath(session.role)}
          className="flex items-center gap-1 text-sm text-zinc-600 underline underline-offset-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver
        </Link>
      </div>

      <div className="rounded-xl border-2 border-zinc-300 bg-white p-4">
        <h2 className="mb-1 text-lg font-semibold text-zinc-900">Cambiar contraseña</h2>
        <p className="mb-4 text-sm text-zinc-600">Elegí una contraseña nueva para tu cuenta.</p>
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
