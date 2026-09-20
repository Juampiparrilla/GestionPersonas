"use server";

import { getSessionContext } from "@/lib/session";

import { loadLeaderDetailData } from "./detail";
import type { LeaderDetailData } from "./detailTypes";

// Para el panel de detalle de escritorio (se pide al elegir una fila).
export async function loadLeaderDetailAction(leaderId: string): Promise<LeaderDetailData | null> {
  const session = await getSessionContext();
  if (!session || session.role !== "superadmin") return null;
  return loadLeaderDetailData(leaderId);
}
