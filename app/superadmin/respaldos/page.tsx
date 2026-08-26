import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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
    <div className="flex flex-1 flex-col gap-6 bg-zinc-50 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Respaldos y reportes</h1>
        <Link href="/superadmin" className="flex items-center gap-1 text-sm text-zinc-600 underline underline-offset-2">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver
        </Link>
      </div>

      <div className="rounded-xl border-2 border-zinc-300 bg-white p-4">
        <h2 className="mb-1 text-lg font-semibold text-zinc-900">Reportes por correo</h2>
        <p className="mb-4 text-sm text-zinc-600">
          Recibí los reportes de tu organización por email de forma automática, o mandate uno de prueba ahora mismo.
        </p>
        <ReportEmailScheduleForm initialSchedule={schedule} />
      </div>

      <div className="rounded-xl border-2 border-zinc-300 bg-white p-4">
        <h2 className="mb-1 text-lg font-semibold text-zinc-900">Backup real</h2>
        <p className="mb-4 text-sm text-zinc-600">
          Respaldo completo de la base de datos, generado por un workflow de GitHub Actions.
        </p>
        <BackupScheduleForm initialSchedule={backupSchedule} initialRuns={backupRuns} />
      </div>
    </div>
  );
}
