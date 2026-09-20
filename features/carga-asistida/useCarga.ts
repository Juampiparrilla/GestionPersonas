"use client";

import { useMemo, useState } from "react";

import type {
  LeaderOption,
  LeaderPointerGroup,
  Operation,
  PointerOption,
} from "./parts";

// Estado de la carga asistida (dirigente, tipo de registro, puntero para las
// personas, mensaje de "listo"). Lo comparten la pantalla movil y el panel
// lateral de escritorio.
export function useCarga({
  leaders,
  pointerGroups,
  initialLeaderId,
  initialOperation,
}: {
  leaders: LeaderOption[];
  pointerGroups: LeaderPointerGroup[];
  initialLeaderId?: string | null;
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

  function selectPointer(pointer: PointerOption | null) {
    setSelectedPointer(pointer);
    setPointerQuery(pointer ? pointer.fullName : "");
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

  return {
    leaders,
    leaderQuery,
    setLeaderQuery,
    selectedLeader,
    operation,
    pointerQuery,
    setPointerQuery,
    selectedPointer,
    selectPointer,
    pointersForLeader,
    formKey,
    justCreated,
    showForm,
    selectLeader,
    changeLeader,
    selectOperation,
    handleCreated,
  };
}

export type CargaState = ReturnType<typeof useCarga>;
