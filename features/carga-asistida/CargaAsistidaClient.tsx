"use client";

import { Car, CircleCheck, UserRound, UserRoundPlus, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";

import { CreatePersonForm } from "@/features/people/CreatePersonForm";
import { CreatePointerForm } from "@/features/pointers/CreatePointerForm";
import { CreateVehicleForm } from "@/features/vehicles/CreateVehicleForm";

type Operation = "pointer" | "person" | "vehicle";

type LeaderOption = { id: string; fullName: string };
type PointerOption = { id: string; fullName: string };
type LeaderPointerGroup = { leaderId: string; leaderName: string; pointers: PointerOption[] };

const OPERATIONS: { value: Operation; label: string; icon: typeof UserRoundPlus }[] = [
  { value: "pointer", label: "Agregar puntero", icon: UserRoundPlus },
  { value: "person", label: "Agregar persona", icon: UsersRound },
  { value: "vehicle", label: "Agregar vehículo", icon: Car },
];

function Autocomplete<T extends { id: string; fullName: string }>({
  query,
  onQueryChange,
  onSelect,
  options,
  placeholder,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (option: T) => void;
  options: T[];
  placeholder: string;
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
        className="h-12 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
      />
      {matches.length > 0 ? (
        <div className="flex flex-col gap-1 rounded-lg border border-zinc-200 p-1">
          {matches.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option)}
              className="rounded-md px-3 py-2 text-left text-sm font-medium text-zinc-900 hover:bg-zinc-100"
            >
              {option.fullName}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CargaAsistidaClient({
  leaders,
  pointerGroups,
}: {
  leaders: LeaderOption[];
  pointerGroups: LeaderPointerGroup[];
}) {
  const [leaderQuery, setLeaderQuery] = useState("");
  const [selectedLeader, setSelectedLeader] = useState<LeaderOption | null>(null);
  const [operation, setOperation] = useState<Operation>("pointer");

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-2 text-sm font-medium text-zinc-700">
          <UserRound className="h-4 w-4 text-zinc-500" aria-hidden="true" />
          Dirigente
        </p>
        {selectedLeader ? (
          <div className="flex items-center justify-between rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2">
            <p className="text-sm font-medium text-zinc-900">{selectedLeader.fullName}</p>
            <button
              type="button"
              onClick={changeLeader}
              className="text-xs font-medium text-zinc-600 underline underline-offset-2"
            >
              Cambiar
            </button>
          </div>
        ) : (
          <Autocomplete
            query={leaderQuery}
            onQueryChange={setLeaderQuery}
            onSelect={selectLeader}
            options={leaders}
            placeholder="Buscar dirigente por nombre"
          />
        )}
      </div>

      {selectedLeader ? (
        <>
          <div className="flex flex-col gap-2">
            {OPERATIONS.map((option) => {
              const Icon = option.icon;
              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                    operation === option.value ? "border-zinc-900 bg-zinc-50" : "border-zinc-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="operation"
                    checked={operation === option.value}
                    onChange={() => selectOperation(option.value)}
                    className="h-4 w-4"
                  />
                  <Icon className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                  <span className="text-sm font-medium text-zinc-900">{option.label}</span>
                </label>
              );
            })}
          </div>

          {operation === "person" ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-zinc-700">Puntero</p>
              {pointersForLeader.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  Este dirigente todavía no tiene punteros cargados. Agregá uno primero.
                </p>
              ) : selectedPointer ? (
                <div className="flex items-center justify-between rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2">
                  <p className="text-sm font-medium text-zinc-900">{selectedPointer.fullName}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPointer(null);
                      setPointerQuery("");
                    }}
                    className="text-xs font-medium text-zinc-600 underline underline-offset-2"
                  >
                    Cambiar
                  </button>
                </div>
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
                />
              )}
            </div>
          ) : null}

          {justCreated ? (
            <p className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
              <CircleCheck className="h-4 w-4" aria-hidden="true" />
              {justCreated}
            </p>
          ) : null}

          <div className="rounded-xl border-2 border-zinc-300 bg-white p-4">
            {operation === "pointer" ? (
              <CreatePointerForm
                key={`pointer-${formKey}`}
                leaderId={selectedLeader.id}
                onCreated={() => handleCreated("Puntero agregado.")}
              />
            ) : null}
            {operation === "vehicle" ? (
              <CreateVehicleForm
                key={`vehicle-${formKey}`}
                leaderId={selectedLeader.id}
                onCreated={() => handleCreated("Vehículo agregado.")}
              />
            ) : null}
            {operation === "person" && selectedPointer ? (
              <CreatePersonForm
                key={`person-${formKey}-${selectedPointer.id}`}
                pointerId={selectedPointer.id}
                onCreated={() => handleCreated("Persona agregada.")}
              />
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
