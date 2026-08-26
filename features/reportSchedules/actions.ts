"use server";

import { revalidatePath } from "next/cache";

import { listActiveLeaders } from "@/features/leaders/queries";
import { listAllPeopleGroupedByLeader } from "@/features/people/queries";
import { listAllPointersGroupedByLeader } from "@/features/pointers/queries";
import { listAllVehiclesGroupedByLeader } from "@/features/vehicles/queries";
import { parseReportTypes, sendOrganizationReportEmail, type ReportType } from "@/lib/email/sendReportEmail";
import { getRequestMeta } from "@/lib/request-meta";
import { getOrganizationName } from "@/lib/reports/organizationName";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { friendlyRpcError } from "@/utils/rpc-errors";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ReportEmailScheduleState = { error: string | null; success: boolean };

export async function setReportEmailScheduleAction(
  _prevState: ReportEmailScheduleState,
  formData: FormData
): Promise<ReportEmailScheduleState> {
  const enabled = formData.get("enabled") === "on";
  const recipientEmail = String(formData.get("recipientEmail") ?? "").trim();
  const frequency = String(formData.get("frequency") ?? "daily");
  const dayOfWeekRaw = String(formData.get("dayOfWeek") ?? "").trim();
  const dayOfMonthRaw = String(formData.get("dayOfMonth") ?? "").trim();
  const reportTypes = parseReportTypes(formData.getAll("reportTypes").map(String));

  if (enabled) {
    if (!recipientEmail || !EMAIL_PATTERN.test(recipientEmail)) {
      return { error: "Ingresá un correo destinatario válido.", success: false };
    }
    if (reportTypes.length === 0) {
      return { error: "Elegí al menos un reporte para enviar.", success: false };
    }
  }

  const session = await getSessionContext();
  if (!session || session.role !== "superadmin") {
    return { error: "No tenés permiso para hacer esto.", success: false };
  }

  const supabase = await createClient();
  const { ip, userAgent } = await getRequestMeta();

  const { error } = await supabase.rpc("fn_set_report_email_schedule", {
    p_enabled: enabled,
    p_recipient_email: recipientEmail || null,
    p_frequency: frequency,
    p_day_of_week: frequency === "weekly" && dayOfWeekRaw ? Number(dayOfWeekRaw) : null,
    p_day_of_month: frequency === "monthly" && dayOfMonthRaw ? Number(dayOfMonthRaw) : null,
    p_report_types: reportTypes,
    p_ip: ip,
    p_user_agent: userAgent,
  });

  if (error) {
    return { error: friendlyRpcError(error.message), success: false };
  }

  revalidatePath("/superadmin/respaldos");
  return { error: null, success: true };
}

export type SendTestEmailResult = { ok: true } | { ok: false; error: string };

export async function sendTestReportEmailAction(
  recipientEmail: string,
  reportTypes: ReportType[]
): Promise<SendTestEmailResult> {
  const session = await getSessionContext();
  if (!session || session.role !== "superadmin") {
    return { ok: false, error: "No tenés permiso para hacer esto." };
  }
  if (!recipientEmail || !EMAIL_PATTERN.test(recipientEmail)) {
    return { ok: false, error: "Ingresá un correo destinatario válido." };
  }
  if (reportTypes.length === 0) {
    return { ok: false, error: "Elegí al menos un reporte para enviar." };
  }

  const organizationId = session.organizationId!;
  const [organizationName, leaders, pointerGroups, peopleGroups, vehicleGroups] = await Promise.all([
    getOrganizationName(organizationId),
    listActiveLeaders(),
    listAllPointersGroupedByLeader(),
    listAllPeopleGroupedByLeader(),
    listAllVehiclesGroupedByLeader(),
  ]);

  try {
    return await sendOrganizationReportEmail({
      organizationName: organizationName ?? "Gestión de Personas",
      recipientEmail,
      reportTypes,
      leaders,
      pointerGroups,
      peopleGroups,
      vehicleGroups,
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No pudimos enviar el correo." };
  }
}
