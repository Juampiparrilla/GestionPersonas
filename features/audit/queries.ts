import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/domain";

export type AuditLogItem = {
  id: string;
  createdAt: string;
  action: string;
  entityType: string;
  entityId: string | null;
  leaderId: string | null;
  pointerId: string | null;
  personId: string | null;
  actorProfileId: string | null;
  actorRole: UserRole | null;
  organizationId: string;
  ipAddress: string | null;
  userAgent: string | null;
};

export type AuditLogFilters = {
  organizationId?: string;
  leaderId?: string;
  pointerId?: string;
  personId?: string;
  vehicleId?: string;
  actorProfileId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
};

// El Administrador de Organización siempre queda acotado a la suya (RLS ya
// lo garantiza -- audit_select_admin -- pero se repite explicito el filtro
// para que el resto de los filtros no dependan solo de eso). El
// Administrador de Plataforma puede elegir cualquier organizacion, o
// ninguna para ver todas.
export async function listAuditLogs(filters: AuditLogFilters, limit = 200): Promise<AuditLogItem[]> {
  const session = await getSessionContext();
  if (!session || (session.role !== "superadmin" && session.role !== "platform_admin")) return [];

  const supabase = await createClient();
  let query = supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(limit);

  if (session.role === "superadmin") {
    query = query.eq("organization_id", session.organizationId!);
  } else if (filters.organizationId) {
    query = query.eq("organization_id", filters.organizationId);
  }

  if (filters.leaderId) query = query.eq("leader_id", filters.leaderId);
  if (filters.pointerId) query = query.eq("pointer_id", filters.pointerId);
  if (filters.personId) query = query.eq("person_id", filters.personId);
  if (filters.vehicleId) query = query.eq("entity_type", "vehicle").eq("entity_id", filters.vehicleId);
  if (filters.actorProfileId) query = query.eq("actor_profile_id", filters.actorProfileId);
  if (filters.action) query = query.eq("action", filters.action);
  if (filters.dateFrom) query = query.gte("created_at", `${filters.dateFrom}T00:00:00`);
  if (filters.dateTo) query = query.lte("created_at", `${filters.dateTo}T23:59:59`);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    leaderId: row.leader_id,
    pointerId: row.pointer_id,
    personId: row.person_id,
    actorProfileId: row.actor_profile_id,
    actorRole: row.actor_role,
    organizationId: row.organization_id,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
  }));
}

export type AuditDisplayNames = {
  actorNames: Map<string, string>;
  individualNames: Map<string, string>;
  organizationNames: Map<string, string>;
  vehiclePlates: Map<string, string>;
};

// individuals.id coincide con leaders.id / pointers.id / registered_people.id
// (mismo patron usado en el resto del proyecto) -- por eso un solo query a
// `individuals` alcanza para resolver nombres de dirigente, puntero y
// persona, sin importar si la fila ya fue dada de baja.
export async function resolveAuditDisplayNames(logs: AuditLogItem[]): Promise<AuditDisplayNames> {
  const supabase = await createClient();

  const actorIds = new Set<string>();
  const individualIds = new Set<string>();
  const organizationIds = new Set<string>();
  const vehicleIds = new Set<string>();

  for (const log of logs) {
    if (log.actorProfileId) actorIds.add(log.actorProfileId);
    if (log.leaderId) individualIds.add(log.leaderId);
    if (log.pointerId) individualIds.add(log.pointerId);
    if (log.personId) individualIds.add(log.personId);
    organizationIds.add(log.organizationId);
    if (log.entityType === "vehicle" && log.entityId) vehicleIds.add(log.entityId);
    if (log.entityType === "organization" && log.entityId) organizationIds.add(log.entityId);
  }

  const [actorsResult, individualsResult, organizationsResult, vehiclesResult] = await Promise.all([
    actorIds.size > 0
      ? supabase.from("profiles").select("id, full_name").in("id", Array.from(actorIds))
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    individualIds.size > 0
      ? supabase.from("individuals").select("id, full_name").in("id", Array.from(individualIds))
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    organizationIds.size > 0
      ? supabase.from("organizations").select("id, name").in("id", Array.from(organizationIds))
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    vehicleIds.size > 0
      ? supabase.from("vehicles").select("id, plate_display").in("id", Array.from(vehicleIds))
      : Promise.resolve({ data: [] as { id: string; plate_display: string }[] }),
  ]);

  return {
    actorNames: new Map((actorsResult.data ?? []).map((row) => [row.id, row.full_name])),
    individualNames: new Map((individualsResult.data ?? []).map((row) => [row.id, row.full_name])),
    organizationNames: new Map((organizationsResult.data ?? []).map((row) => [row.id, row.name])),
    vehiclePlates: new Map((vehiclesResult.data ?? []).map((row) => [row.id, row.plate_display])),
  };
}
