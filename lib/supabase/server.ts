import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/types/database";

// `cookies()` es asincronico desde Next.js 15+ (y ya no admite acceso
// sincronico a partir de Next.js 16), por eso este helper tambien lo es.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Se esta llamando desde un Server Component (no desde un
            // Server Action ni desde proxy.ts), que no puede escribir
            // cookies. proxy.ts ya se encarga de refrescar la sesion en
            // ese caso, asi que es seguro ignorar el error aca.
          }
        },
      },
    }
  );
}
