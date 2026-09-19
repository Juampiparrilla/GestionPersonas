import { Settings } from "lucide-react";

import { LogoutRow, MenuList } from "@/components/ui/MenuList";
import { LeaderBottomNav } from "@/components/ui/RoleNav";
import { Screen } from "@/components/ui/Screen";

export default function DirigenteMasPage() {
  return (
    <Screen title="Más" bar={<LeaderBottomNav />}>
      <MenuList
        items={[{ href: "/mi-cuenta", label: "Mi cuenta", hint: "Cambiar contraseña", icon: Settings }]}
      />
      <LogoutRow />
    </Screen>
  );
}
