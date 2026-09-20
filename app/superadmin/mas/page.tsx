import {
  ClipboardList,
  ClipboardPlus,
  DatabaseBackup,
  MailCheck,
  Settings,
  SlidersHorizontal,
} from "lucide-react";

import { LogoutRow, MenuList } from "@/components/ui/MenuList";
import { AdminBottomNav } from "@/components/ui/RoleNav";
import { Screen } from "@/components/ui/Screen";

// Lo que no entra en la barra inferior (Inicio · Dirigentes · Punteros ·
// Personas · Vehículos · Más).
export default function SuperadminMasPage() {
  return (
    <Screen shell title="Más" bar={<AdminBottomNav />}>
      <MenuList
        items={[
          {
            href: "/superadmin/carga-asistida",
            label: "Carga asistida",
            hint: "Cargar en nombre de un dirigente",
            icon: ClipboardPlus,
          },
          {
            href: "/superadmin/reportes/personalizado",
            label: "Reporte personalizado",
            hint: "Elegí qué incluir y de quién",
            icon: SlidersHorizontal,
          },
          {
            href: "/superadmin/auditoria",
            label: "Auditoría",
            hint: "Quién cargó qué y cuándo",
            icon: ClipboardList,
          },
          {
            href: "/superadmin/envio-correo",
            label: "Envío por correo de Reportes",
            hint: "Reportes automáticos por email",
            icon: MailCheck,
          },
          {
            href: "/superadmin/respaldos",
            label: "Respaldos",
            hint: "Copia completa de la base de datos",
            icon: DatabaseBackup,
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
