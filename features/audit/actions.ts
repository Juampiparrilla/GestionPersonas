"use server";

import { describeAuditEntry } from "./labels";
import { listAuditLogs, resolveAuditDisplayNames, type AuditLogFilters } from "./queries";

export type AuditLogRowView = {
  id: string;
  createdAt: string;
  action: string;
  description: string;
  organizationName: string | null;
  ipAddress: string | null;
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
  }));
}
