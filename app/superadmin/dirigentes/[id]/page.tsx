import { notFound } from "next/navigation";

import { LeaderDetailClient } from "@/features/leaders/LeaderDetailClient";
import { loadLeaderDetailData } from "@/features/leaders/detail";
import { listActiveLeaders } from "@/features/leaders/queries";

export default async function LeaderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [leaders, detail] = await Promise.all([listActiveLeaders(), loadLeaderDetailData(id)]);

  const leader = leaders.find((item) => item.id === id);
  if (!leader) {
    notFound();
  }

  return <LeaderDetailClient leader={leader} {...detail} />;
}
