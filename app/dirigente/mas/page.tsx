import { Settings } from "lucide-react";

import { DesktopRedirect } from "@/components/desktop/DesktopRedirect";
import { LogoutRow, MenuList } from "@/components/ui/MenuList";
import { LeaderBottomNav } from "@/components/ui/RoleNav";
import { Screen } from "@/components/ui/Screen";

export default function DirigenteMasPage() {
  return (
    <Screen shell title="Más" bar={<LeaderBottomNav />}>
      <DesktopRedirect to="/dirigente" />
      <MenuList
        items={[{ href: "/mi-cuenta", label: "Mi cuenta", hint: "Cambiar contraseña", icon: Settings }]}
      />
      <LogoutRow />
    </Screen>
  );
}
