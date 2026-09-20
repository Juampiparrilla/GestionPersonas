import { redirect } from "next/navigation";

import { AdminShell } from "@/components/desktop/AdminShell";
import { getSuperadminStats } from "@/features/leaders/queries";
import { roleHomePath } from "@/lib/routes";
import { roleLabel } from "@/lib/roles";
import { getSessionContext } from "@/lib/session";

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionContext();

  if (!session) {
    redirect("/login");
  }
  if (session.role !== "superadmin") {
    redirect(roleHomePath(session.role));
  }

  const stats = await getSuperadminStats();

  return (
    <AdminShell
      counts={stats}
      fullName={session.fullName}
      roleLabel={roleLabel(session.role)}
    >
      {children}
    </AdminShell>
  );
}
