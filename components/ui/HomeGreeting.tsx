import { AccountMenu } from "@/components/AccountMenu";
import { RoleHelpButton } from "@/components/RoleHelpButton";
import { roleLabel } from "@/lib/roles";
import type { UserRole } from "@/types/domain";

// Saludo del Inicio: "Bienvenido" + nombre + rol, y a la derecha los dos
// botones de icono (ayuda del rol, menu de cuenta).
export function HomeGreeting({ fullName, role }: { fullName: string; role: UserRole }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[13px] text-ink-2">Bienvenido</p>
        <h1 className="text-[21px] font-semibold tracking-[-0.015em] text-ink">{fullName}</h1>
        <p className="text-[13px] text-ink-2">{roleLabel(role)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <RoleHelpButton role={role} />
        <AccountMenu />
      </div>
    </div>
  );
}
