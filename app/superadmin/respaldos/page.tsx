import { Screen } from "@/components/ui/Screen";
import { cardClass } from "@/components/ui/styles";
import { BackupScheduleForm } from "@/features/backups/BackupScheduleForm";
import { getBackupSchedule, listBackupRuns } from "@/features/backups/queries";

export default async function RespaldosPage() {
  const [backupSchedule, backupRuns] = await Promise.all([getBackupSchedule(), listBackupRuns()]);

  return (
    <Screen shell title="Respaldos" backHref="/superadmin/mas">
      <div className="flex w-full max-w-[720px] flex-col gap-4">
      <div className={`${cardClass} p-4`}>
        <p className="mb-4 text-sm text-ink-2">
          Respaldo completo de la base de datos, generado por un workflow de GitHub Actions.
        </p>
        <BackupScheduleForm initialSchedule={backupSchedule} initialRuns={backupRuns} />
      </div>
      </div>
    </Screen>
  );
}
