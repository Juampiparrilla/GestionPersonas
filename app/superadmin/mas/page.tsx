import {
  Car,
  ClipboardList,
  ClipboardPlus,
  MailCheck,
  Settings,
  UserRound,
  UsersRound,
} from "lucide-react";

import { LogoutRow, MenuList } from "@/components/ui/MenuList";
import { AdminBottomNav } from "@/components/ui/RoleNav";
import { Screen } from "@/components/ui/Screen";

export default function SuperadminMasPage() {
  return (
    <Screen title="Más" bar={<AdminBottomNav />}>
      <MenuList
        items={[
          {
            href: "/superadmin/carga-asistida",
            label: "Carga asistida",
            hint: "Cargar en nombre de un dirigente",
            icon: ClipboardPlus,
          },
          {
            href: "/superadmin/auditoria",
            label: "Auditoría",
            hint: "Quién cargó qué y cuándo",
            icon: ClipboardList,
          },
          {
            href: "/superadmin/respaldos",
            label: "Respaldos y reportes",
            hint: "Envío por correo y backups",
            icon: MailCheck,
          },
        ]}
      />
      <MenuList
        items={[
          { href: "/superadmin/punteros", label: "Punteros", icon: UsersRound },
          { href: "/superadmin/personas", label: "Personas", icon: UserRound },
          { href: "/superadmin/vehiculos", label: "Vehículos", icon: Car },
        ]}
      />
      <MenuList
        items={[{ href: "/mi-cuenta", label: "Mi cuenta", hint: "Cambiar contraseña", icon: Settings }]}
      />
      <LogoutRow />
    </Screen>
  );
}
