"use server";

import { listActiveLeaders } from "@/features/leaders/queries";
import { listAllPointersGroupedByLeader } from "@/features/pointers/queries";

import type { LeaderOption, LeaderPointerGroup } from "./parts";

export type CargaOptions = { leaders: LeaderOption[]; pointerGroups: LeaderPointerGroup[] };

// Opciones de la carga asistida (dirigentes y sus punteros) para el panel
// lateral de escritorio, que se abre desde cualquier pantalla: se piden recien
// al abrirlo en vez de cargarlas en todas las pantallas. Las consultas ya
// devuelven vacio si quien llama no es Administrador de Organizacion.
export async function loadCargaOptionsAction(): Promise<CargaOptions> {
  const [leaders, pointerGroups] = await Promise.all([
    listActiveLeaders(),
    listAllPointersGroupedByLeader(),
  ]);

  return {
    leaders: leaders.map((leader) => ({ id: leader.id, fullName: leader.fullName })),
    pointerGroups: pointerGroups.map((group) => ({
      leaderId: group.leaderId,
      leaderName: group.leaderName,
      pointers: group.pointers.map((pointer) => ({ id: pointer.id, fullName: pointer.fullName })),
    })),
  };
}
