import { cache } from "react";

import { AUDIT_TIME_ZONE, formatActivityTime } from "@/features/audit/dates";
import { ACTION_FILTER_LABEL, auditContext, auditSubject } from "@/features/audit/labels";
import { listAuditLogs, resolveAuditDisplayNames } from "@/features/audit/queries";
import { getSuperadminStats } from "@/features/leaders/queries";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export type DayCount = { date: string; label: string; count: number };

export type DesktopHomeData = {
  stats: { leaders: number; pointers: number; people: number; vehicles: number };
  // Texto de apoyo de cada tarjeta (siempre texto, sin indicadores de color).
  deltas: { leaders: string; pointers: string; people: string; vehicles: string };
  // Cargas (altas) por dia, hasta hoy: 30 dias (la pantalla muestra los ultimos
  // 7 o los 30).
  perDay: DayCount[];
  activity: { id: string; time: string; title: string; detail: string }[];
  updatedAt: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const CREATE_ACTIONS = ["CREATE_LEADER", "CREATE_POINTER", "CREATE_PERSON", "CREATE_VEHICLE"];
const CHART_DAYS = 30;

function argentinaDay(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: AUDIT_TIME_ZONE });
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

// Datos del Inicio de escritorio: tarjetas con su texto de apoyo, altas por
// dia y ultima actividad. Con cache() por si mas de un componente los pide en
// un mismo request.
export const getDesktopHomeData = cache(async (): Promise<DesktopHomeData | null> => {
  const session = await getSessionContext();
  if (!session || session.role !== "superadmin") return null;

  const supabase = await createClient();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS).toISOString();
  const chartFrom = new Date(now.getTime() - CHART_DAYS * DAY_MS).toISOString();

  const [stats, newLeaders, pointerRows, peopleRows, vehicleRows, createLogs, activityLogs] =
    await Promise.all([
      getSuperadminStats(),
      supabase
        .from("individuals")
        .select("id", { count: "exact", head: true })
        .eq("position", "leader")
        .eq("status", "active")
        .gte("created_at", weekAgo),
      supabase.from("pointers").select("id").eq("is_removed", false),
      supabase.from("registered_people").select("pointer_id").eq("is_removed", false),
      supabase.from("vehicles").select("leader_id").eq("is_removed", false),
      supabase
        .from("audit_logs")
        .select("created_at")
        .in("action", CREATE_ACTIONS)
        .gte("created_at", chartFrom)
        .limit(5000),
      listAuditLogs({}, 4),
    ]);

  const pointersWithPeople = new Set((peopleRows.data ?? []).map((row) => row.pointer_id));
  const pointersWithoutPeople = (pointerRows.data ?? []).filter(
    (row) => !pointersWithPeople.has(row.id)
  ).length;
  const leadersWithVehicles = new Set((vehicleRows.data ?? []).map((row) => row.leader_id)).size;
  const average = stats.pointers > 0 ? Math.round(stats.people / stats.pointers) : 0;
  const newLeadersCount = newLeaders.count ?? 0;

  const countsByDay = new Map<string, number>();
  for (const row of createLogs.data ?? []) {
    const day = argentinaDay(new Date(row.created_at));
    countsByDay.set(day, (countsByDay.get(day) ?? 0) + 1);
  }
  const perDay: DayCount[] = [];
  for (let offset = CHART_DAYS - 1; offset >= 0; offset--) {
    const date = argentinaDay(new Date(now.getTime() - offset * DAY_MS));
    perDay.push({ date, label: date.slice(8), count: countsByDay.get(date) ?? 0 });
  }

  const names = await resolveAuditDisplayNames(activityLogs);
  const activity = activityLogs.map((log) => ({
    id: log.id,
    time: formatActivityTime(log.createdAt),
    title: ACTION_FILTER_LABEL[log.action] ?? log.action,
    // Sin repetir: a veces el registro y el contexto dicen lo mismo.
    detail: Array.from(new Set([auditSubject(log, names), auditContext(log, names)])).join(" · "),
  }));

  return {
    stats,
    deltas: {
      leaders: newLeadersCount > 0 ? `+${newLeadersCount} esta semana` : "sin altas esta semana",
      pointers:
        pointersWithoutPeople > 0
          ? `${plural(pointersWithoutPeople, "sin personas", "sin personas")}`
          : "todos con personas",
      people: `${average} por puntero`,
      vehicles: `en ${plural(leadersWithVehicles, "dirigente", "dirigentes")}`,
    },
    perDay,
    activity,
    updatedAt: now.toLocaleTimeString("es-AR", {
      timeZone: AUDIT_TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  };
});
