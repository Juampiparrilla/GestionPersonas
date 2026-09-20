import { redirect } from "next/navigation";

import { LeaderShell } from "@/components/desktop/LeaderShell";
import { getLeaderCounts } from "@/features/dashboard/leaderQueries";
import { getLeaderWriteStatus } from "@/lib/leader-write-status";
import { roleHomePath } from "@/lib/routes";
import { roleLabel } from "@/lib/roles";
import { getSessionContext } from "@/lib/session";

export default async function DirigenteLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionContext();

  if (!session) {
    redirect("/login");
  }
  if (session.role !== "leader") {
    redirect(roleHomePath(session.role));
  }

  const [counts, writeStatus] = await Promise.all([
    getLeaderCounts(),
    getLeaderWriteStatus(session.organizationId!, session.leaderId!),
  ]);

  return (
    <LeaderShell
      counts={counts}
      canWrite={writeStatus.canWrite}
      fullName={session.fullName}
      roleLabel={roleLabel(session.role)}
    >
      {children}
    </LeaderShell>
  );
}
