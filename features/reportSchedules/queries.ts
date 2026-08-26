import type { ReportType } from "@/lib/email/reportTypes";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export type ReportEmailSchedule = {
  enabled: boolean;
  recipientEmail: string | null;
  frequency: "daily" | "weekly" | "monthly";
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  reportTypes: ReportType[];
};

const DEFAULT_SCHEDULE: ReportEmailSchedule = {
  enabled: false,
  recipientEmail: null,
  frequency: "daily",
  dayOfWeek: null,
  dayOfMonth: null,
  reportTypes: [],
};

export async function getReportEmailSchedule(): Promise<ReportEmailSchedule> {
  const session = await getSessionContext();
  if (!session || session.role !== "superadmin") return DEFAULT_SCHEDULE;

  const supabase = await createClient();
  const { data } = await supabase
    .from("report_email_schedules")
    .select("enabled, recipient_email, frequency, day_of_week, day_of_month, report_types")
    .eq("organization_id", session.organizationId!)
    .maybeSingle();

  if (!data) return DEFAULT_SCHEDULE;

  return {
    enabled: data.enabled,
    recipientEmail: data.recipient_email,
    frequency: data.frequency as ReportEmailSchedule["frequency"],
    dayOfWeek: data.day_of_week,
    dayOfMonth: data.day_of_month,
    reportTypes: (data.report_types ?? []) as ReportType[],
  };
}
