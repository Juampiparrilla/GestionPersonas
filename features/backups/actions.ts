"use server";

import { revalidatePath } from "next/cache";

import { getRequestMeta } from "@/lib/request-meta";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { triggerBackupWorkflow, type TriggerBackupResult } from "@/lib/backups/triggerWorkflow";
import { friendlyRpcError } from "@/utils/rpc-errors";

export type BackupScheduleState = { error: string | null; success: boolean };

export async function setBackupScheduleAction(
  _prevState: BackupScheduleState,
  formData: FormData
): Promise<BackupScheduleState> {
  const enabled = formData.get("enabled") === "on";
  const frequency = String(formData.get("frequency") ?? "daily");
  const dayOfWeekRaw = String(formData.get("dayOfWeek") ?? "").trim();
  const dayOfMonthRaw = String(formData.get("dayOfMonth") ?? "").trim();
  const retentionCount = Number(formData.get("retentionCount") ?? 7);

  if (!Number.isInteger(retentionCount) || retentionCount < 1 || retentionCount > 60) {
    return { error: "La retención tiene que ser un número entre 1 y 60.", success: false };
  }

  const session = await getSessionContext();
  if (!session || session.role !== "superadmin") {
    return { error: "No tenés permiso para hacer esto.", success: false };
  }

  const supabase = await createClient();
  const { ip, userAgent } = await getRequestMeta();

  const { error } = await supabase.rpc("fn_set_backup_schedule", {
    p_enabled: enabled,
    p_frequency: frequency,
    p_day_of_week: frequency === "weekly" && dayOfWeekRaw ? Number(dayOfWeekRaw) : null,
    p_day_of_month: frequency === "monthly" && dayOfMonthRaw ? Number(dayOfMonthRaw) : null,
    p_retention_count: retentionCount,
    p_ip: ip,
    p_user_agent: userAgent,
  });

  if (error) {
    return { error: friendlyRpcError(error.message), success: false };
  }

  revalidatePath("/superadmin/respaldos");
  return { error: null, success: true };
}

export async function triggerBackupNowAction(): Promise<TriggerBackupResult> {
  const session = await getSessionContext();
  if (!session || session.role !== "superadmin") {
    return { ok: false, error: "No tenés permiso para hacer esto." };
  }

  return triggerBackupWorkflow(session.organizationId!);
}
