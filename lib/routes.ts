import type { UserRole } from "@/types/domain";

export function roleHomePath(role: UserRole): string {
  switch (role) {
    case "platform_admin":
      return "/plataforma";
    case "superadmin":
      return "/superadmin";
    case "leader":
      return "/dirigente";
    case "reports":
      return "/reportes";
  }
}
