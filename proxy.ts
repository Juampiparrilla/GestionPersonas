import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// Nota Next.js 16: el archivo `middleware.ts` fue renombrado a `proxy.ts`
// (y la funcion exportada de `middleware` a `proxy`); el comportamiento es
// el mismo. Ver node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresca el token de sesion si esta vencido, para que los Server
  // Components y Server Actions siempre lean un usuario valido.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!user && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

// Rutas accesibles sin sesion. El chequeo de ROL (que un dirigente no entre
// a /superadmin, etc.) no se hace aca -- se hace en el layout de cada area,
// que si tiene el contexto de perfil completo. Esto es solo la primera
// barrera (sesion si/no) antes de que se renderice nada.
const PUBLIC_PATHS = [
  "/login",
  "/recuperar-contrasena",
  "/actualizar-contrasena",
  "/auth/callback",
  "/auth/verify",
];

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
