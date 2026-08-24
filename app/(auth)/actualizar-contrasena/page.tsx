import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

import { UpdatePasswordForm } from "./UpdatePasswordForm";

const ALLOWED_TYPES = ["invite", "recovery"] as const;
type AllowedType = (typeof ALLOWED_TYPES)[number];

function isAllowedType(value: string | undefined): value is AllowedType {
  return ALLOWED_TYPES.includes(value as AllowedType);
}

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string }>;
}) {
  const params = await searchParams;
  let verified = false;

  // Se verifica el token directo contra el servidor (verifyOtp), en vez de
  // depender del link que arma Supabase para el flujo de redireccion: ese
  // link usa el formato "implicit" (token en el fragmento de la URL), pero
  // el cliente de este proyecto esta fijo en modo "pkce" (asi viene
  // @supabase/ssr, no se puede desactivar) y lo rechaza. verifyOtp no
  // depende de ningun flujo de redireccion, asi que funciona siempre.
  if (params.token_hash && isAllowedType(params.type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: params.token_hash,
      type: params.type,
    });
    verified = !error;
  }

  if (!verified) {
    // Por si ya habia una sesion valida de antes (ej. alguien recarga esta
    // pantalla despues de haber verificado el link una vez).
    const session = await getSessionContext();
    verified = Boolean(session);
  }

  if (!verified) {
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
