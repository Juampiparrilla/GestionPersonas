import { type NextRequest, NextResponse } from "next/server";

import {
  getLeadersForOrgCron,
  getPeopleGroupsForOrgCron,
  getPointerGroupsForOrgCron,
  getVehicleGroupsForOrgCron,
} from "@/lib/email/orgDataForCron";
import { parseReportTypes, sendOrganizationReportEmail } from "@/lib/email/sendReportEmail";
import { REPORT_TIME_ZONE } from "@/lib/reports/filename";
import { createAdminClient } from "@/lib/supabase/admin";

// Disparado por Vercel Cron (vercel.json, una vez al dia -- ver comentario
// ahi sobre la limitacion del plan Hobby). El header Authorization con
// CRON_SECRET lo manda Vercel automatico cuando esa env var esta seteada en
// el proyecto; sin eso, cualquiera podria pegarle a esta URL y disparar
// envios de email a nombre de la app.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();

  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: REPORT_TIME_ZONE,
    weekday: "short",
    day: "2-digit",
  }).formatToParts(now);
  const weekdayShort = parts.find((part) => part.type === "weekday")?.value ?? "Sun";
  const dayOfMonth = Number(parts.find((part) => part.type === "day")?.value ?? "1");
  const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dayOfWeek = WEEKDAY_INDEX[weekdayShort] ?? 0;

  const { data: schedules, error } = await admin
    .from("report_email_schedules")
    .select("organization_id, recipient_email, frequency, day_of_week, day_of_month, report_types")
    .eq("enabled", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let processed = 0;

  for (const schedule of schedules ?? []) {
    const shouldRun =
      schedule.frequency === "daily" ||
      (schedule.frequency === "weekly" && schedule.day_of_week === dayOfWeek) ||
      (schedule.frequency === "monthly" && schedule.day_of_month === dayOfMonth);

    if (!shouldRun || !schedule.recipient_email) continue;

    const reportTypes = parseReportTypes(schedule.report_types ?? []);
    if (reportTypes.length === 0) continue;

    const start = Date.now();
    try {
      const { data: organization } = await admin
        .from("organizations")
        .select("name")
        .eq("id", schedule.organization_id)
        .maybeSingle();

      const [leaders, pointerGroups, peopleGroups, vehicleGroups] = await Promise.all([
        getLeadersForOrgCron(schedule.organization_id),
        getPointerGroupsForOrgCron(schedule.organization_id),
        getPeopleGroupsForOrgCron(schedule.organization_id),
        getVehicleGroupsForOrgCron(schedule.organization_id),
      ]);

      const result = await sendOrganizationReportEmail({
        organizationName: organization?.name ?? "Gestión de Personas",
        recipientEmail: schedule.recipient_email,
        reportTypes,
        leaders,
        pointerGroups,
        peopleGroups,
        vehicleGroups,
      });

      await admin.from("scheduled_job_runs").insert({
        organization_id: schedule.organization_id,
        kind: "report_email",
        status: result.ok ? "success" : "error",
        detail: result.ok ? null : { error: result.error },
        duration_ms: Date.now() - start,
      });
    } catch (err) {
      await admin.from("scheduled_job_runs").insert({
        organization_id: schedule.organization_id,
        kind: "report_email",
        status: "error",
        detail: { error: err instanceof Error ? err.message : "Error desconocido" },
        duration_ms: Date.now() - start,
      });
    }

    processed += 1;
  }

  return NextResponse.json({ processed });
}
