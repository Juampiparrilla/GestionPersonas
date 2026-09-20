"use client";

import { Screen } from "@/components/ui/Screen";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

import { CargaBody, LeaderPicker } from "./CargaBody";
import {
  OPERATIONS,
  SelectedCard,
  type LeaderOption,
  type LeaderPointerGroup,
  type Operation,
} from "./parts";
import { useCarga } from "./useCarga";

// Pantalla de carga asistida (movil; en escritorio la carga es un panel
// lateral -- ver components/desktop/CargaPanel).
export function CargaAsistidaClient({
  leaders,
  pointerGroups,
  initialLeaderId,
  initialOperation,
}: {
  leaders: LeaderOption[];
  pointerGroups: LeaderPointerGroup[];
  initialLeaderId?: string;
  initialOperation?: Operation;
}) {
  const carga = useCarga({ leaders, pointerGroups, initialLeaderId, initialOperation });

  return (
    <Screen
      shell
      title="Carga asistida"
      backHref="/superadmin"
      flush={carga.showForm}
      headerExtra={
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-ink-2">Queda registrado en la auditoría con tu nombre.</p>
          {carga.selectedLeader ? (
            <SelectedCard
              eyebrow="Dirigente"
              name={carga.selectedLeader.fullName}
              onChange={carga.changeLeader}
            />
          ) : null}
        </div>
      }
    >
      <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col gap-4">
        {!carga.selectedLeader ? (
          <LeaderPicker carga={carga} />
        ) : (
          <>
            <SegmentedControl
              label="Qué querés cargar"
              options={OPERATIONS}
              value={carga.operation}
              onChange={carga.selectOperation}
            />
            <CargaBody carga={carga} />
          </>
        )}
      </div>
    </Screen>
  );
}
