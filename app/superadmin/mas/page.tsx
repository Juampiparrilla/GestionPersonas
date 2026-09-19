import {
  ClipboardList,
  ClipboardPlus,
  FileText,
  MailCheck,
  Settings,
  UserRound,
} from "lucide-react";

import { LogoutRow, MenuList } from "@/components/ui/MenuList";
import { AdminBottomNav } from "@/components/ui/RoleNav";
import { Screen } from "@/components/ui/Screen";

// Lo que no entra en la barra inferior (Inicio · Dirigentes · Punteros ·
// Vehículos · Más).
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
            href: "/superadmin/personas",
            label: "Personas",
            hint: "Registradas por cada puntero",
            icon: UserRound,
          },
          {
            href: "/superadmin/reportes",
            label: "Reportes",
            hint: "PDF y Excel, o a medida",
            icon: FileText,
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
        items={[{ href: "/mi-cuenta", label: "Mi cuenta", hint: "Cambiar contraseña", icon: Settings }]}
      />
      <LogoutRow />
    </Screen>
  );
}
