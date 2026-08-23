import { redirect } from "next/navigation";

import { roleHomePath } from "@/lib/routes";
import { getSessionContext } from "@/lib/session";

export default async function Home() {
  const session = await getSessionContext();
  redirect(session ? roleHomePath(session.role) : "/login");
}
