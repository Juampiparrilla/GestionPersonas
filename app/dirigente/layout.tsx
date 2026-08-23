import { redirect } from "next/navigation";

import { roleHomePath } from "@/lib/routes";
import { getSessionContext } from "@/lib/session";

export default async function DirigenteLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionContext();

  if (!session) {
    redirect("/login");
  }
  if (session.role !== "leader") {
    redirect(roleHomePath(session.role));
  }

  return <>{children}</>;
}
