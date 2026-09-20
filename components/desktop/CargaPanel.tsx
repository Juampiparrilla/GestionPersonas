"use client";

import { Info } from "lucide-react";
import { useEffect, useState } from "react";

import { Spinner } from "@/components/Spinner";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Sheet } from "@/components/ui/Sheet";
import { loadCargaOptionsAction, type CargaOptions } from "@/features/carga-asistida/actions";
import { CargaBody, LeaderPicker } from "@/features/carga-asistida/CargaBody";
import { OPERATIONS, SelectedCard, type Operation } from "@/features/carga-asistida/parts";
import { useCarga } from "@/features/carga-asistida/useCarga";

import { useShellUrl } from "./ShellContext";

function CargaPanelContent({
  options,
  operation,
  leaderId,
  onOperationChange,
}: {
  options: CargaOptions;
  operation: Operation;
  leaderId: string | null;
  onOperationChange: (operation: Operation) => void;
}) {
  const carga = useCarga({
    leaders: options.leaders,
    pointerGroups: options.pointerGroups,
    initialLeaderId: leaderId,
    initialOperation: operation,
  });

  return (
    <div className="flex flex-1 flex-col gap-4">
      <SegmentedControl
        label="Qué querés cargar"
        options={OPERATIONS}
        value={carga.operation}
        onChange={(value) => {
          carga.selectOperation(value);
          onOperationChange(value);
        }}
      />

      {carga.selectedLeader ? (
        <SelectedCard eyebrow="Dirigente" name={carga.selectedLeader.fullName} onChange={carga.changeLeader} />
      ) : (
        <LeaderPicker carga={carga} />
      )}

      <CargaBody carga={carga} />

      {carga.showForm ? (
        <p className="flex items-start gap-2.5 rounded-2xl border border-line bg-muted p-3.5 text-[13px] text-ink-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          El DNI se verifica contra toda la base mientras lo escribís.
        </p>
      ) : null}
    </div>
  );
}

// Panel lateral de carga (520px, con velo): se abre desde cualquier pantalla
// con la barra lateral, el atajo N o `?cargar=` en la URL. No es una ruta
// propia: asi el listado sobre el que se trabaja no se pierde de vista.
export function CargaPanelHost() {
  const { cargar, cargarLeaderId, closeCarga, setParams } = useShellUrl();
  const [options, setOptions] = useState<CargaOptions | null>(null);

  useEffect(() => {
    if (!cargar || options) return;
    let cancelled = false;
    loadCargaOptionsAction().then((result) => {
      if (!cancelled) setOptions(result);
    });
    return () => {
      cancelled = true;
    };
  }, [cargar, options]);

  if (!cargar) return null;

  return (
    <Sheet
      open
      onClose={closeCarga}
      title="Cargar registro"
      subtitle="Queda registrado en la auditoría con tu nombre."
    >
      {options ? (
        <CargaPanelContent
          options={options}
          operation={cargar}
          leaderId={cargarLeaderId}
          onOperationChange={(operation) => setParams({ cargar: operation }, { replace: true })}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center py-16">
          <Spinner className="h-8 w-8 text-accent" />
        </div>
      )}
    </Sheet>
  );
}
