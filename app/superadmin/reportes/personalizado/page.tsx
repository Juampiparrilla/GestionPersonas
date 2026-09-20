import { Screen } from "@/components/ui/Screen";
import { cardClass } from "@/components/ui/styles";
import { listActiveLeaders } from "@/features/leaders/queries";
import { listAllPointersGroupedByLeader } from "@/features/pointers/queries";
import { CustomReportForm } from "@/features/reports/CustomReportForm";

export default async function ReportePersonalizadoPage() {
  const [leaders, pointerGroups] = await Promise.all([listActiveLeaders(), listAllPointersGroupedByLeader()]);

  const pointers = pointerGroups.flatMap((group) =>
    group.pointers.map((pointer) => ({
      id: pointer.id,
      fullName: pointer.fullName,
      leaderName: group.leaderName,
    }))
  );

  return (
    <Screen shell title="Reporte personalizado" backHref="/superadmin/mas">
      <div className="flex w-full max-w-[720px] flex-col gap-4">
      <div className={`${cardClass} p-4`}>
        <CustomReportForm leaders={leaders.map((leader) => ({ id: leader.id, fullName: leader.fullName }))} pointers={pointers} />
      </div>
      </div>
    </Screen>
  );
}
