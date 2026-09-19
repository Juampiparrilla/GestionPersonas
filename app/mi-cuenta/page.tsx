import { redirect } from "next/navigation";

import { UpdatePasswordForm } from "@/app/(auth)/actualizar-contrasena/UpdatePasswordForm";
import { Screen } from "@/components/ui/Screen";
import { cardClass } from "@/components/ui/styles";
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
    <Screen title="Mi cuenta" backHref={roleHomePath(session.role)}>
      <div className={`${cardClass} p-4`}>
        <h2 className="mb-1 text-[17px] font-semibold text-ink">Cambiar contraseña</h2>
        <p className="mb-4 text-sm text-ink-2">Elegí una contraseña nueva para tu cuenta.</p>
        <UpdatePasswordForm />
      </div>
    </Screen>
  );
}
