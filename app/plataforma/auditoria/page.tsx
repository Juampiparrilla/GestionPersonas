import { fetchAuditLogsAction } from "@/features/audit/actions";
import { AuditLogClient } from "@/features/audit/AuditLogClient";
import { rangeDates } from "@/features/audit/dates";
import { PlatformBottomNav } from "@/components/ui/RoleNav";
import { listOrganizations } from "@/features/organizations/queries";

export default async function PlataformaAuditoriaPage() {
  const [rows, organizations] = await Promise.all([
    fetchAuditLogsAction(rangeDates("today")),
    listOrganizations(),
  ]);

  return (
    <AuditLogClient
      initialRows={rows}
      initialRange="today"
      organizations={organizations.map((org) => ({ id: org.id, fullName: org.name }))}
      bar={<PlatformBottomNav />}
    />
  );
}
