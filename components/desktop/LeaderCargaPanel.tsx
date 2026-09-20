"use client";

import { CircleCheck, Info, Lock } from "lucide-react";
import { useEffect, useState } from "react";

import { Spinner } from "@/components/Spinner";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Sheet } from "@/components/ui/Sheet";
import { Autocomplete, OPERATIONS, SelectedCard, type Operation, type PointerOption } from "@/features/carga-asistida/parts";
import { CreatePersonForm } from "@/features/people/CreatePersonForm";
import { CreatePointerForm } from "@/features/pointers/CreatePointerForm";
import { loadLeaderCargaOptionsAction } from "@/features/pointers/deskActions";
import { CreateVehicleForm } from "@/features/vehicles/CreateVehicleForm";

import { useShellUrl } from "./ShellContext";

function Content({
  pointers,
  operation,
  pointerId,
  onOperationChange,
}: {
  pointers: PointerOption[];
  operation: Operation;
  pointerId: string | null;
  onOperationChange: (operation: Operation) => void;
}) {
  const [op, setOp] = useState<Operation>(operation);
  const [selectedPointer, setSelectedPointer] = useState<PointerOption | null>(
    () => pointers.find((pointer) => pointer.id === pointerId) ?? null
  );
  const [pointerQuery, setPointerQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  function created(text: string) {
    setMessage(text);
    setFormKey((key) => key + 1);
    if (op === "person") {
      setSelectedPointer(null);
      setPointerQuery("");
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <SegmentedControl
        label="Qué querés cargar"
        options={OPERATIONS}
        value={op}
        onChange={(value) => {
          setOp(value);
          setMessage(null);
          setSelectedPointer(null);
          setPointerQuery("");
          onOperationChange(value);
        }}
      />

      {op === "person" ? (
        <div className="flex flex-col gap-1.5">
          <Eyebrow>Puntero</Eyebrow>
          {pointers.length === 0 ? (
            <p className="text-sm text-ink-2">Todavía no tenés punteros cargados. Agregá uno primero.</p>
          ) : selectedPointer ? (
            <SelectedCard
              eyebrow="Puntero"
              name={selectedPointer.fullName}
              onChange={() => {
                setSelectedPointer(null);
                setPointerQuery("");
              }}
            />
          ) : (
            <Autocomplete
              query={pointerQuery}
              onQueryChange={setPointerQuery}
              onSelect={(option) => {
                setSelectedPointer(option);
                setPointerQuery(option.fullName);
              }}
              options={pointers}
              placeholder="Buscar puntero por nombre"
              label="Buscar puntero por nombre"
            />
          )}
        </div>
      ) : null}

      {message ? (
        <p
          role="status"
          className="flex animate-[toast-in_0.2s_ease-out] items-center gap-2 rounded-2xl border border-ok-border bg-ok-bg p-3.5 text-[15px] font-semibold text-ok-ink"
        >
          <CircleCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
          {message}
        </p>
      ) : null}

      {op === "pointer" ? (
        <CreatePointerForm
          key={`pointer-${formKey}`}
          showAgain={false}
          onCreated={() => created("Puntero agregado.")}
        />
      ) : null}
      {op === "vehicle" ? (
        <CreateVehicleForm
          key={`vehicle-${formKey}`}
          showAgain={false}
          onCreated={() => created("Vehículo agregado.")}
        />
      ) : null}
      {op === "person" && selectedPointer ? (
        <CreatePersonForm
          key={`person-${formKey}-${selectedPointer.id}`}
          pointerId={selectedPointer.id}
          showAgain={false}
          onCreated={() => created("Persona agregada.")}
        />
      ) : null}

      <p className="flex items-start gap-2.5 rounded-2xl border border-line bg-muted p-3.5 text-[13px] text-ink-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        El DNI se verifica mientras lo escribís.
      </p>
    </div>
  );
}

// Panel lateral de carga del Dirigente (520px, con velo): se abre desde
// cualquier pantalla con la barra lateral, el atajo N o `?cargar=` en la URL.
export function LeaderCargaPanelHost({ canWrite }: { canWrite: boolean }) {
  const { cargar, cargarPointerId, closeCarga, setParams } = useShellUrl();
  const [pointers, setPointers] = useState<PointerOption[] | null>(null);

  useEffect(() => {
    if (!cargar || !canWrite || pointers) return;
    let cancelled = false;
    loadLeaderCargaOptionsAction().then((result) => {
      if (!cancelled) setPointers(result?.pointers ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [cargar, canWrite, pointers]);

  if (!cargar) return null;

  return (
    <Sheet
      open
      onClose={closeCarga}
      title="Cargar registro"
      subtitle="Elegí qué querés agregar."
    >
      {!canWrite ? (
        <p className="flex items-start gap-2 rounded-[14px] border border-line bg-muted p-3 text-[13px] text-ink-2">
          <Lock className="h-4 w-4 shrink-0 translate-y-0.5" aria-hidden="true" />
          La carga está cerrada en este momento. Podés consultar, pero no agregar ni modificar nada.
        </p>
      ) : pointers ? (
        <Content
          pointers={pointers}
          operation={cargar}
          pointerId={cargarPointerId}
          onOperationChange={(operation) =>
            setParams({ cargar: operation, puntero: null }, { replace: true })
          }
        />
      ) : (
        <div className="flex flex-1 items-center justify-center py-16">
          <Spinner className="h-8 w-8 text-accent" />
        </div>
      )}
    </Sheet>
  );
}
