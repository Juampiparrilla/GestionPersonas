import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

// Cliente con la service_role key: bypassea RLS por completo. Por eso:
//   1) solo se usa dentro de Server Actions,
//   2) esa Server Action tiene que verificar ELLA MISMA que quien llama es
//      superadmin (getSessionContext()) ANTES de llamar a esto -- ninguna
//      politica RLS protege nada aca,
//   3) nunca se importa desde un componente cliente ("server-only" tira un
//      error en build si eso llegara a pasar).
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
