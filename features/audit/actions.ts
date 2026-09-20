"use server";

import {
  auditCategory,
  auditContext,
  auditEntity,
  auditOrigin,
  auditSubject,
  describeAuditEntry,
  type AuditCategory,
} from "./labels";
import { listAuditLogs, resolveAuditDisplayNames, type AuditLogFilters } from "./queries";

export type AuditLogRowView = {
  id: string;
  createdAt: string;
  action: string;
  description: string;
  organizationName: string | null;
  ipAddress: string | null;
  // Columnas de la tabla de escritorio.
  category: AuditCategory;
  entity: string;
  subject: string;
  context: string;
  actorName: string | null;
  origin: "Móvil" | "Escritorio" | null;
};

export async function fetchAuditLogsAction(filters: AuditLogFilters): Promise<AuditLogRowView[]> {
  const logs = await listAuditLogs(filters);
  const names = await resolveAuditDisplayNames(logs);

  return logs.map((log) => ({
    id: log.id,
    createdAt: log.createdAt,
    action: log.action,
    description: describeAuditEntry(log, names),
    organizationName: names.organizationNames.get(log.organizationId) ?? null,
    ipAddress: log.ipAddress,
    category: auditCategory(log.action),
    entity: auditEntity(log),
    subject: auditSubject(log, names),
    context: auditContext(log, names),
    actorName: log.actorProfileId ? (names.actorNames.get(log.actorProfileId) ?? null) : null,
    origin: auditOrigin(log.userAgent),
  }));
}
