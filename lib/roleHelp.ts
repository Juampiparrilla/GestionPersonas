import type { UserRole } from "@/types/domain";

// Contenido del icono de ayuda ("i") en cada dashboard -- explica en
// criollo que puede hacer cada rol, para alguien sin conocimiento tecnico
// que recien empieza a usar la app.
export const ROLE_HELP: Record<UserRole, { title: string; items: string[] }> = {
  leader: {
    title: "Como Dirigente podés:",
    items: [
      "Agregar, editar y dar de baja tus punteros.",
      "Ver y agregar las personas que registró cada uno de tus punteros.",
      "Agregar, editar y dar de baja tus vehículos.",
      "Generar reportes en PDF de tus punteros, personas y vehículos.",
      "Cambiar tu contraseña desde el ícono de ajustes.",
    ],
  },
  superadmin: {
    title: "Como Administrador de Organización podés:",
    items: [
      "Crear dirigentes y darles acceso a la app.",
      "Cargar un puntero, una persona o un vehículo en nombre de un dirigente (Carga asistida).",
      "Ver el historial de auditoría de tu organización.",
      "Generar reportes en PDF y Excel de dirigentes, punteros, personas y vehículos.",
      "Configurar el envío automático de reportes por correo.",
      "Configurar y disparar backups de la base de datos.",
      "Activar o desactivar la carga de datos para todos los dirigentes.",
      "Cambiar tu contraseña desde el ícono de ajustes.",
    ],
  },
  platform_admin: {
    title: "Como Administrador de Plataforma podés:",
    items: [
      "Crear organizaciones nuevas.",
      "Crear o reenviar el acceso del administrador de cada organización.",
      "Activar o desactivar una organización.",
      "Ver el historial de auditoría de todas las organizaciones.",
      "No accedés a los dirigentes, punteros, personas ni vehículos de ninguna organización — esa información es privada de cada una.",
      "Cambiar tu contraseña desde el ícono de ajustes.",
    ],
  },
  reports: {
    title: "Como Reports podés:",
    items: ["Este rol todavía no tiene pantallas propias asignadas."],
  },
};
