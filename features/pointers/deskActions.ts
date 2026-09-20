"use server";

import { listPeopleForPointer, type PersonListItem } from "@/features/people/queries";
import { getSessionContext } from "@/lib/session";

import { listMyPointers } from "./queries";

// Para el escritorio del Dirigente. Las consultas usan la sesion de quien
// llama (RLS): un dirigente solo ve lo suyo.

export async function loadPointerPeopleAction(pointerId: string): Promise<PersonListItem[] | null> {
  const session = await getSessionContext();
  if (!session || session.role !== "leader") return null;
  return listPeopleForPointer(pointerId);
}

export type LeaderCargaOptions = { pointers: { id: string; fullName: string }[] };

// Punteros propios, para elegir a cual agregarle una persona en el panel de carga.
export async function loadLeaderCargaOptionsAction(): Promise<LeaderCargaOptions | null> {
  const session = await getSessionContext();
  if (!session || session.role !== "leader") return null;
  const pointers = await listMyPointers();
  return { pointers: pointers.map((pointer) => ({ id: pointer.id, fullName: pointer.fullName })) };
}
