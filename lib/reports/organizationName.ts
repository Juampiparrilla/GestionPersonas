import { createClient } from "@/lib/supabase/server";

// Los reportes se generan siempre para la organizacion de quien esta
// logueado (dirigente o Administrador de Organizacion) -- RLS ya limita la
// fila que puede leer, esto solo trae el nombre para mostrarlo en el
// encabezado del PDF/Excel (pedido de Juampi, multitenant).
export async function getOrganizationName(organizationId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("organizations").select("name").eq("id", organizationId).maybeSingle();
  return data?.name ?? null;
}
