import { createClient } from "@/lib/supabase/server";

export async function getLoadingEnabled(organizationId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("system_settings")
    .select("loading_enabled")
    .eq("organization_id", organizationId)
    .maybeSingle();

  return data?.loading_enabled ?? true;
}
