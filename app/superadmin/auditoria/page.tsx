import { fetchAuditLogsAction } from "@/features/audit/actions";
import { AuditLogClient } from "@/features/audit/AuditLogClient";
import { rangeDates } from "@/features/audit/dates";
import { listActiveLeaders } from "@/features/leaders/queries";

export default async function SuperadminAuditoriaPage() {
  const [rows, leaders] = await Promise.all([
    fetchAuditLogsAction(rangeDates("today")),
    listActiveLeaders(),
  ]);

  return (
    <AuditLogClient
      initialRows={rows}
      initialRange="today"
      shell
      leaders={leaders.map((leader) => ({ id: leader.id, fullName: leader.fullName }))}
      backHref="/superadmin/mas"
    />
  );
}
