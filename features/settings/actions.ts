"use server";

import { revalidatePath } from "next/cache";

import { getRequestMeta } from "@/lib/request-meta";
import { createClient } from "@/lib/supabase/server";

export async function setGlobalLoadingAction(enabled: boolean) {
  const supabase = await createClient();
  const { ip, userAgent } = await getRequestMeta();

  await supabase.rpc("fn_set_global_loading", {
    p_enabled: enabled,
    p_ip: ip,
    p_user_agent: userAgent,
  });

  revalidatePath("/superadmin");
}
