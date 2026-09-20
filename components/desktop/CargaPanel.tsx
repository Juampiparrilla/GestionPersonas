"use client";

import { Info } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Spinner } from "@/components/Spinner";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { KeepOpenProvider } from "@/components/ui/FormParts";
import { Sheet } from "@/components/ui/Sheet";
import {
  loadCargaOptionsAction,
  type CargaOptions,
} from "@/features/carga-asistida/actions";
import { CargaBody, LeaderPicker } from "@/features/carga-asistida/CargaBody";
import {
  OPERATIONS,
  SelectedCard,
  type Operation,
} from "@/features/carga-asistida/parts";
import { useCarga } from "@/features/carga-asistida/useCarga";

import { useShellUrl } from "./ShellContext";
import { useDeskToast } from "./useDeskToast";

function CargaPanelContent({
  options,
  operation,
  leaderId,
  keepOpen,
  onDone,
  onSaved,
  onOperationChange,
}: {
  options: CargaOptions;
  operation: Operation;
  leaderId: string | null;
  keepOpen: boolean;
  onDone: (message: string) => void;
  onSaved: () => void;
  onOperationChange: (operation: Operation) => void;
}) {
  const carga = useCarga({
    leaders: options.leaders,
    pointerGroups: options.pointerGroups,
    initialLeaderId: leaderId,
    initialOperation: operation,
    keepOpen,
    onDone,
    onSaved,
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
        <SelectedCard
          eyebrow="Dirigente"
          name={carga.selectedLeader.fullName}
          onChange={carga.changeLeader}
        />
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

// Carga las opciones cada vez que se abre el panel (los punteros cargados
// despues de la ultima apertura tienen que estar) y de nuevo despues de cada alta.
function LoadedContent({
  cargar,
  cargarLeaderId,
  keepOpen,
  onDone,
  onOperationChange,
}: {
  cargar: Operation;
  cargarLeaderId: string | null;
  keepOpen: boolean;
  onDone: (message: string) => void;
  onOperationChange: (operation: Operation) => void;
}) {
  const [options, setOptions] = useState<CargaOptions | null>(null);

  const load = useCallback(() => {
    loadCargaOptionsAction().then(setOptions);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!options) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Spinner className="h-8 w-8 text-accent" />
      </div>
    );
  }

  return (
    <CargaPanelContent
      options={options}
      operation={cargar}
      leaderId={cargarLeaderId}
      keepOpen={keepOpen}
      onDone={onDone}
      onSaved={load}
      onOperationChange={onOperationChange}
    />
  );
}

// Panel lateral de carga (520px, con velo): se abre desde cualquier pantalla
// con la barra lateral, el atajo N o `?cargar=` en la URL. No es una ruta
// propia: asi el listado sobre el que se trabaja no se pierde de vista.
export function CargaPanelHost() {
  const { cargar, cargarLeaderId, closeCarga, setParams } = useShellUrl();
  const [keepOpen, setKeepOpen] = useState(false);
  const { toast, show } = useDeskToast();

  if (!cargar) return toast;

  return (
    <>
      {toast}
      <KeepOpenProvider value={{ value: keepOpen, onChange: setKeepOpen }}>
        <Sheet
          open
          onClose={closeCarga}
          title="Cargar registro"
          subtitle="Queda registrado en la auditoría con tu nombre."
        >
          <LoadedContent
            cargar={cargar}
            cargarLeaderId={cargarLeaderId}
            keepOpen={keepOpen}
            onDone={(message) => {
              show(message);
              closeCarga();
            }}
            onOperationChange={(operation) => setParams({ cargar: operation }, { replace: true })}
          />
        </Sheet>
      </KeepOpenProvider>
    </>
  );
}
