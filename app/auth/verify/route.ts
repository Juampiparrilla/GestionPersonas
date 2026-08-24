import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const ALLOWED_TYPES = ["invite", "recovery"] as const;
type AllowedType = (typeof ALLOWED_TYPES)[number];

function isAllowedType(value: string | null): value is AllowedType {
  return ALLOWED_TYPES.includes(value as AllowedType);
}

// No se usa lib/supabase/server.ts aca a proposito: esa utilidad depende de
// cookies() de next/headers, pensada para Server Components/Actions. En un
// Route Handler que construye su propia NextResponse.redirect(), lo unico
// que garantiza que la cookie de sesion quede en la respuesta es atarla
// directo a ESE objeto -- mismo patron que proxy.ts.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/actualizar-contrasena";

  if (tokenHash && isAllowedType(type)) {
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/actualizar-contrasena`);
}
