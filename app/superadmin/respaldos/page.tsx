import { Screen } from "@/components/ui/Screen";
import { cardClass } from "@/components/ui/styles";
import { BackupScheduleForm } from "@/features/backups/BackupScheduleForm";
import { getBackupSchedule, listBackupRuns } from "@/features/backups/queries";
import { ReportEmailScheduleForm } from "@/features/reportSchedules/ReportEmailScheduleForm";
import { getReportEmailSchedule } from "@/features/reportSchedules/queries";

export default async function RespaldosPage() {
  const [schedule, backupSchedule, backupRuns] = await Promise.all([
    getReportEmailSchedule(),
    getBackupSchedule(),
    listBackupRuns(),
  ]);

  return (
    <Screen title="Respaldos y reportes" backHref="/superadmin/mas">
      <div className={`${cardClass} p-4`}>
        <h2 className="mb-1 text-[17px] font-semibold text-ink">Reportes por correo</h2>
        <p className="mb-4 text-sm text-ink-2">
          Recibí los reportes de tu organización por email de forma automática, o mandate uno de prueba ahora mismo.
        </p>
        <ReportEmailScheduleForm initialSchedule={schedule} />
      </div>

      <div className={`${cardClass} p-4`}>
        <h2 className="mb-1 text-[17px] font-semibold text-ink">Backup real</h2>
        <p className="mb-4 text-sm text-ink-2">
          Respaldo completo de la base de datos, generado por un workflow de GitHub Actions.
        </p>
        <BackupScheduleForm initialSchedule={backupSchedule} initialRuns={backupRuns} />
      </div>
    </Screen>
  );
}
