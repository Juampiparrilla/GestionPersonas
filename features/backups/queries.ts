import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export type BackupSchedule = {
  enabled: boolean;
  frequency: "daily" | "weekly" | "monthly";
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  retentionCount: number;
};

const DEFAULT_SCHEDULE: BackupSchedule = {
  enabled: false,
  frequency: "daily",
  dayOfWeek: null,
  dayOfMonth: null,
  retentionCount: 7,
};

export async function getBackupSchedule(): Promise<BackupSchedule> {
  const session = await getSessionContext();
  if (!session || session.role !== "superadmin") return DEFAULT_SCHEDULE;

  const supabase = await createClient();
  const { data } = await supabase
    .from("backup_schedules")
    .select("enabled, frequency, day_of_week, day_of_month, retention_count")
    .eq("organization_id", session.organizationId!)
    .maybeSingle();

  if (!data) return DEFAULT_SCHEDULE;

  return {
    enabled: data.enabled,
    frequency: data.frequency as BackupSchedule["frequency"],
    dayOfWeek: data.day_of_week,
    dayOfMonth: data.day_of_month,
    retentionCount: data.retention_count,
  };
}

export type BackupRun = {
  id: string;
  status: "success" | "error";
  createdAt: string;
  detail: Record<string, unknown> | null;
};

export async function listBackupRuns(limit = 10): Promise<BackupRun[]> {
  const session = await getSessionContext();
  if (!session || session.role !== "superadmin") return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("scheduled_job_runs")
    .select("id, status, created_at, detail")
    .eq("organization_id", session.organizationId!)
    .eq("kind", "backup")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id,
    status: row.status,
    createdAt: row.created_at,
    detail: row.detail as Record<string, unknown> | null,
  }));
}
