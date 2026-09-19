import { CargaAsistidaClient } from "@/features/carga-asistida/CargaAsistidaClient";
import { listActiveLeaders } from "@/features/leaders/queries";
import { listAllPointersGroupedByLeader } from "@/features/pointers/queries";

const OPERATIONS = ["pointer", "person", "vehicle"] as const;

export default async function CargaAsistidaPage({
  searchParams,
}: {
  searchParams: Promise<{ leaderId?: string; tipo?: string }>;
}) {
  const [{ leaderId, tipo }, leaders, pointerGroups] = await Promise.all([
    searchParams,
    listActiveLeaders(),
    listAllPointersGroupedByLeader(),
  ]);

  const initialOperation = OPERATIONS.find((operation) => operation === tipo);

  return (
    <CargaAsistidaClient
      leaders={leaders.map((leader) => ({ id: leader.id, fullName: leader.fullName }))}
      pointerGroups={pointerGroups.map((group) => ({
        leaderId: group.leaderId,
        leaderName: group.leaderName,
        pointers: group.pointers.map((pointer) => ({ id: pointer.id, fullName: pointer.fullName })),
      }))}
      initialLeaderId={leaderId}
      initialOperation={initialOperation}
    />
  );
}
