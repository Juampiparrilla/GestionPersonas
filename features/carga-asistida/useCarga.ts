"use client";

import { useMemo, useState } from "react";

import { focusFirstField } from "@/components/ui/FormParts";

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
  keepOpen,
  onDone,
  onSaved,
}: {
  leaders: LeaderOption[];
  pointerGroups: LeaderPointerGroup[];
  initialLeaderId?: string | null;
  initialOperation?: Operation;
  // Solo escritorio: con `keepOpen` en false, al guardar se llama a `onDone`
  // (cierra el panel) en vez de dejar el formulario vacio para otra carga.
  keepOpen?: boolean;
  onDone?: (message: string) => void;
  // Despues de cada alta (para refrescar las listas de punteros).
  onSaved?: () => void;
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
    if (keepOpen === false && onDone) {
      onDone(message);
      return;
    }
    onSaved?.();
    if (keepOpen) focusFirstField();
    setJustCreated(message);
    setFormKey((key) => key + 1);
    // Con el panel anclado se conserva el puntero: cargar varias personas
    // del mismo puntero es el caso tipico.
    if (operation === "person" && !keepOpen) {
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
