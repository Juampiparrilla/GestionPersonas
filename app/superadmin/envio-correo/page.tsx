import { Screen } from "@/components/ui/Screen";
import { cardClass } from "@/components/ui/styles";
import { ReportEmailScheduleForm } from "@/features/reportSchedules/ReportEmailScheduleForm";
import { getReportEmailSchedule } from "@/features/reportSchedules/queries";

export default async function EnvioCorreoPage() {
  const schedule = await getReportEmailSchedule();

  return (
    <Screen title="Envío por correo de Reportes" backHref="/superadmin/mas">
      <div className={`${cardClass} p-4`}>
        <p className="mb-4 text-sm text-ink-2">
          Recibí los reportes de tu organización por email de forma automática, o mandate uno de prueba ahora mismo.
        </p>
        <ReportEmailScheduleForm initialSchedule={schedule} />
      </div>
    </Screen>
  );
}
