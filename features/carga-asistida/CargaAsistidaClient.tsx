"use client";

import { CircleCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Screen } from "@/components/ui/Screen";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { hintClass, inputClass, labelClass, linkActionClass } from "@/components/ui/styles";
import { CreatePersonForm } from "@/features/people/CreatePersonForm";
import { CreatePointerForm } from "@/features/pointers/CreatePointerForm";
import { CreateVehicleForm } from "@/features/vehicles/CreateVehicleForm";

type Operation = "pointer" | "person" | "vehicle";

type LeaderOption = { id: string; fullName: string };
type PointerOption = { id: string; fullName: string };
type LeaderPointerGroup = { leaderId: string; leaderName: string; pointers: PointerOption[] };

const OPERATIONS: { value: Operation; label: string }[] = [
  { value: "pointer", label: "Puntero" },
  { value: "person", label: "Persona" },
  { value: "vehicle", label: "Vehículo" },
];

function Autocomplete<T extends { id: string; fullName: string }>({
  query,
  onQueryChange,
  onSelect,
  options,
  placeholder,
  label,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (option: T) => void;
  options: T[];
  placeholder: string;
  label: string;
}) {
  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return options.filter((option) => option.fullName.toLowerCase().includes(normalized)).slice(0, 8);
  }, [query, options]);

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className={inputClass}
      />
      {matches.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          {matches.map((option, index) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option)}
              className={`flex min-h-[48px] w-full items-center gap-3 px-3.5 py-2 text-left text-[15px] font-semibold text-ink active:bg-muted ${
                index > 0 ? "border-t border-line-inner" : ""
              }`}
            >
              <Avatar name={option.fullName} size="sm" />
              {option.fullName}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SelectedCard({
  eyebrow,
  name,
  onChange,
}: {
  eyebrow: string;
  name: string;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[13px] border border-line-input bg-surface px-3 py-[9px]">
      <Avatar name={name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-ink-3">
          {eyebrow}
        </p>
        <p className="truncate text-[15px] font-semibold text-ink">{name}</p>
      </div>
      <button type="button" onClick={onChange} className={`${linkActionClass} min-h-[44px] px-1`}>
        Cambiar
      </button>
    </div>
  );
}

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
  const [leaderQuery, setLeaderQuery] = useState("");
  const [selectedLeader, setSelectedLeader] = useState<LeaderOption | null>(
    () => leaders.find((leader) => leader.id === initialLeaderId) ?? null
  );
  const [operation, setOperation] = useState<Operation>(initialOperation ?? "pointer");

  const [pointerQuery, setPointerQuery] = useState("");
  const [selectedPointer, setSelectedPointer] = useState<PointerOption | null>(null);

  const [formKey, setFormKey] = useState(0);
  const [justCreated, setJustCreated] = useState<string | null>(null);

  const pointersForLeader = useMemo(() => {
    if (!selectedLeader) return [];
    return pointerGroups.find((group) => group.leaderId === selectedLeader.id)?.pointers ?? [];
  }, [selectedLeader, pointerGroups]);

  function selectLeader(leader: LeaderOption) {
    setSelectedLeader(leader);
    setLeaderQuery(leader.fullName);
    setSelectedPointer(null);
    setPointerQuery("");
    setJustCreated(null);
  }

  function changeLeader() {
    setSelectedLeader(null);
    setLeaderQuery("");
    setSelectedPointer(null);
    setPointerQuery("");
    setJustCreated(null);
  }

  function selectOperation(value: Operation) {
    setOperation(value);
    setSelectedPointer(null);
    setPointerQuery("");
    setJustCreated(null);
  }

  function handleCreated(message: string) {
    setJustCreated(message);
    setFormKey((key) => key + 1);
    if (operation === "person") {
      setSelectedPointer(null);
      setPointerQuery("");
    }
  }

  const showForm = Boolean(selectedLeader) && (operation !== "person" || Boolean(selectedPointer));

  return (
    <Screen
      title="Carga asistida"
      backHref="/superadmin"
      flush={showForm}
      headerExtra={
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-ink-2">Queda registrado en la auditoría con tu nombre.</p>
          {selectedLeader ? (
            <SelectedCard eyebrow="Dirigente" name={selectedLeader.fullName} onChange={changeLeader} />
          ) : null}
        </div>
      }
    >
      {!selectedLeader ? (
        <div className="flex flex-col gap-1.5">
          <p className={labelClass}>Dirigente</p>
          <Autocomplete
            query={leaderQuery}
            onQueryChange={setLeaderQuery}
            onSelect={selectLeader}
            options={leaders}
            placeholder="Buscar dirigente por nombre"
            label="Buscar dirigente por nombre"
          />
          <p className={hintClass}>Elegí a quién le vas a cargar el dato.</p>
        </div>
      ) : (
        <>
          <SegmentedControl
            label="Qué querés cargar"
            options={OPERATIONS}
            value={operation}
            onChange={selectOperation}
          />

          {operation === "person" ? (
            <div className="flex flex-col gap-1.5">
              <Eyebrow>Puntero</Eyebrow>
              {pointersForLeader.length === 0 ? (
                <p className="text-sm text-ink-2">
                  Este dirigente todavía no tiene punteros cargados. Agregá uno primero.
                </p>
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
                  options={pointersForLeader}
                  placeholder="Buscar puntero por nombre"
                  label="Buscar puntero por nombre"
                />
              )}
            </div>
          ) : null}

          {justCreated ? (
            <p
              role="status"
              className="flex animate-[toast-in_0.2s_ease-out] items-center gap-2 rounded-2xl border border-ok-border bg-ok-bg p-3.5 text-[15px] font-semibold text-ok-ink"
            >
              <CircleCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
              {justCreated}
            </p>
          ) : null}

          {showForm ? (
            <>
              {operation === "pointer" ? (
                <CreatePointerForm
                  key={`pointer-${formKey}`}
                  leaderId={selectedLeader.id}
                  showAgain={false}
                  onCreated={() => handleCreated("Puntero agregado.")}
                />
              ) : null}
              {operation === "vehicle" ? (
                <CreateVehicleForm
                  key={`vehicle-${formKey}`}
                  leaderId={selectedLeader.id}
                  showAgain={false}
                  onCreated={() => handleCreated("Vehículo agregado.")}
                />
              ) : null}
              {operation === "person" && selectedPointer ? (
                <CreatePersonForm
                  key={`person-${formKey}-${selectedPointer.id}`}
                  pointerId={selectedPointer.id}
                  showAgain={false}
                  onCreated={() => handleCreated("Persona agregada.")}
                />
              ) : null}
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}
