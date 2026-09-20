"use client";

import { CircleCheck } from "lucide-react";

import { Eyebrow } from "@/components/ui/Eyebrow";
import { hintClass, labelClass } from "@/components/ui/styles";
import { CreatePersonForm } from "@/features/people/CreatePersonForm";
import { CreatePointerForm } from "@/features/pointers/CreatePointerForm";
import { CreateVehicleForm } from "@/features/vehicles/CreateVehicleForm";

import { Autocomplete, SelectedCard } from "./parts";
import type { CargaState } from "./useCarga";

// Selector de dirigente cuando todavia no hay uno elegido.
export function LeaderPicker({ carga }: { carga: CargaState }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className={labelClass}>Dirigente</p>
      <Autocomplete
        query={carga.leaderQuery}
        onQueryChange={carga.setLeaderQuery}
        onSelect={carga.selectLeader}
        options={carga.leaders}
        placeholder="Buscar dirigente por nombre"
        label="Buscar dirigente por nombre"
      />
      <p className={hintClass}>Elegí a quién le vas a cargar el dato.</p>
    </div>
  );
}

// Selector de puntero (solo para cargar personas) + mensaje de "listo" +
// formulario del tipo elegido.
export function CargaBody({ carga }: { carga: CargaState }) {
  const { operation, selectedLeader, selectedPointer } = carga;

  return (
    <>
      {operation === "person" ? (
        <div className="flex flex-col gap-1.5">
          <Eyebrow>Puntero</Eyebrow>
          {carga.pointersForLeader.length === 0 ? (
            <p className="text-sm text-ink-2">
              Este dirigente todavía no tiene punteros cargados. Agregá uno primero.
            </p>
          ) : selectedPointer ? (
            <SelectedCard
              eyebrow="Puntero"
              name={selectedPointer.fullName}
              onChange={() => carga.selectPointer(null)}
            />
          ) : (
            <Autocomplete
              query={carga.pointerQuery}
              onQueryChange={carga.setPointerQuery}
              onSelect={(option) => carga.selectPointer(option)}
              options={carga.pointersForLeader}
              placeholder="Buscar puntero por nombre"
              label="Buscar puntero por nombre"
            />
          )}
        </div>
      ) : null}

      {carga.justCreated ? (
        <p
          role="status"
          className="flex animate-[toast-in_0.2s_ease-out] items-center gap-2 rounded-2xl border border-ok-border bg-ok-bg p-3.5 text-[15px] font-semibold text-ok-ink"
        >
          <CircleCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
          {carga.justCreated}
        </p>
      ) : null}

      {carga.showForm && selectedLeader ? (
        <>
          {operation === "pointer" ? (
            <CreatePointerForm
              key={`pointer-${carga.formKey}`}
              leaderId={selectedLeader.id}
              showAgain={false}
              onCreated={() => carga.handleCreated("Puntero agregado.")}
            />
          ) : null}
          {operation === "vehicle" ? (
            <CreateVehicleForm
              key={`vehicle-${carga.formKey}`}
              leaderId={selectedLeader.id}
              showAgain={false}
              onCreated={() => carga.handleCreated("Vehículo agregado.")}
            />
          ) : null}
          {operation === "person" && selectedPointer ? (
            <CreatePersonForm
              key={`person-${carga.formKey}-${selectedPointer.id}`}
              pointerId={selectedPointer.id}
              showAgain={false}
              onCreated={() => carga.handleCreated("Persona agregada.")}
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}
