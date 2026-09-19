import { Settings } from "lucide-react";

import { LogoutRow, MenuList } from "@/components/ui/MenuList";
import { PlatformBottomNav } from "@/components/ui/RoleNav";
import { Screen } from "@/components/ui/Screen";
import { roleLabel } from "@/lib/roles";
import { getSessionContext } from "@/lib/session";

export default async function PlataformaMasPage() {
  const session = await getSessionContext();

  return (
    <Screen title="Más" bar={<PlatformBottomNav />}>
      <div className="flex flex-col gap-0.5 px-1">
        <p className="text-base font-semibold text-ink">{session?.fullName}</p>
        <p className="text-[13px] text-ink-2">{roleLabel(session!.role)}</p>
      </div>
      <MenuList
        items={[{ href: "/mi-cuenta", label: "Mi cuenta", hint: "Cambiar contraseña", icon: Settings }]}
      />
      <LogoutRow />
    </Screen>
  );
}
