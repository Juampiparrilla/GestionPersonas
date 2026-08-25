import type { UserRole } from "@/types/domain";

// El identificador de rol en la base sigue siendo "superadmin" (cambiarlo
// implicaria tocar ~20 funciones RPC + todas las policies RLS para un
// cambio puramente cosmetico); acá se centraliza el texto que ve el
// usuario, para que en la UI se lea "Administrador de Organización".
export const ROLE_LABEL: Record<UserRole, string> = {
  platform_admin: "Administrador de Plataforma",
  superadmin: "Administrador de Organización",
  leader: "Dirigente",
  reports: "Reports",
};

export function roleLabel(role: UserRole): string {
  return ROLE_LABEL[role];
}
