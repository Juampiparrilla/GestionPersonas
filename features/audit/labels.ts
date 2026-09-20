import { roleLabel } from "@/lib/roles";

import type { AuditDisplayNames, AuditLogItem } from "./queries";

// Lista de acciones conocidas para el filtro -- se muestran agrupadas por
// entidad en el selector. Si en el futuro se agrega una accion nueva a
// alguna RPC, alcanza con sumarla aca para que aparezca en el filtro (la
// fila igual se lista sin filtro, esto solo alimenta el <select>).
export const AUDIT_ACTIONS = [
  "CREATE_LEADER",
  "UPDATE_LEADER",
  "REMOVE_LEADER",
  "RESTORE_LEADER",
  "REASSIGN_LEADER",
  "SET_LEADER_ACCESS_STATUS",
  "LINK_LEADER_PROFILE",
  "CREATE_POINTER",
  "UPDATE_POINTER",
  "REMOVE_POINTER",
  "RESTORE_POINTER",
  "REASSIGN_POINTER",
  "CREATE_PERSON",
  "UPDATE_PERSON",
  "REMOVE_PERSON",
  "RESTORE_PERSON",
  "REASSIGN_PERSON",
  "CREATE_VEHICLE",
  "UPDATE_VEHICLE",
  "REMOVE_VEHICLE",
  "RESTORE_VEHICLE",
  "OPEN_GLOBAL_LOADING",
  "CLOSE_GLOBAL_LOADING",
  "ORGANIZATION_CREATED",
  "INVITATION_SENT",
  "LOGIN",
  "LOGOUT",
  "REPORT_EMAIL_RECIPIENT_CHANGED",
  "BACKUP_SCHEDULE_UPDATED",
] as const;

// Nombres en criollo para el filtro del <select> -- pensado para que lo
// entienda alguien sin conocimiento tecnico, no solo quien programó esto.
// Las frases completas de cada fila (describeAuditEntry, mas abajo) ya
// eran naturales; esto es solo para la lista de opciones del filtro.
export const ACTION_FILTER_LABEL: Record<string, string> = {
  CREATE_LEADER: "Alta de dirigente",
  UPDATE_LEADER: "Modificación de dirigente",
  REMOVE_LEADER: "Baja de dirigente",
  RESTORE_LEADER: "Restauración de dirigente",
  REASSIGN_LEADER: "Reasignación de dirigente",
  SET_LEADER_ACCESS_STATUS: "Cambio de acceso de dirigente",
  LINK_LEADER_PROFILE: "Activación de cuenta de dirigente",
  CREATE_POINTER: "Alta de puntero",
  UPDATE_POINTER: "Modificación de puntero",
  REMOVE_POINTER: "Baja de puntero",
  RESTORE_POINTER: "Restauración de puntero",
  REASSIGN_POINTER: "Reasignación de puntero",
  CREATE_PERSON: "Alta de persona",
  UPDATE_PERSON: "Modificación de persona",
  REMOVE_PERSON: "Baja de persona",
  RESTORE_PERSON: "Restauración de persona",
  REASSIGN_PERSON: "Reasignación de persona",
  CREATE_VEHICLE: "Alta de vehículo",
  UPDATE_VEHICLE: "Modificación de vehículo",
  REMOVE_VEHICLE: "Baja de vehículo",
  RESTORE_VEHICLE: "Restauración de vehículo",
  OPEN_GLOBAL_LOADING: "Activación de carga general",
  CLOSE_GLOBAL_LOADING: "Desactivación de carga general",
  ORGANIZATION_CREATED: "Creación de organización",
  INVITATION_SENT: "Invitación enviada",
  LOGIN: "Inicio de sesión",
  LOGOUT: "Cierre de sesión",
  REPORT_EMAIL_RECIPIENT_CHANGED: "Cambio de correo de reportes",
  BACKUP_SCHEDULE_UPDATED: "Cambio de configuración de backup",
};

const ACTION_VERB: Record<string, string> = {
  CREATE_LEADER: "creó al dirigente",
  UPDATE_LEADER: "editó al dirigente",
  REMOVE_LEADER: "eliminó al dirigente",
  RESTORE_LEADER: "restauró al dirigente",
  REASSIGN_LEADER: "reasignó al dirigente",
  SET_LEADER_ACCESS_STATUS: "cambió el acceso del dirigente",
  LINK_LEADER_PROFILE: "vinculó la cuenta del dirigente",
  CREATE_POINTER: "agregó al puntero",
  UPDATE_POINTER: "editó al puntero",
  REMOVE_POINTER: "eliminó al puntero",
  RESTORE_POINTER: "restauró al puntero",
  REASSIGN_POINTER: "reasignó al puntero",
  CREATE_PERSON: "agregó a la persona",
  UPDATE_PERSON: "editó a la persona",
  REMOVE_PERSON: "eliminó a la persona",
  RESTORE_PERSON: "restauró a la persona",
  REASSIGN_PERSON: "reasignó a la persona",
  CREATE_VEHICLE: "agregó el vehículo",
  UPDATE_VEHICLE: "editó el vehículo",
  REMOVE_VEHICLE: "eliminó el vehículo",
  RESTORE_VEHICLE: "restauró el vehículo",
  OPEN_GLOBAL_LOADING: "activó la carga global",
  CLOSE_GLOBAL_LOADING: "desactivó la carga global",
  ORGANIZATION_CREATED: "creó la organización",
  INVITATION_SENT: "envió una invitación",
  LOGIN: "inició sesión",
  LOGOUT: "cerró sesión",
  REPORT_EMAIL_RECIPIENT_CHANGED: "cambió el correo destinatario de los reportes",
  BACKUP_SCHEDULE_UPDATED: "cambió la configuración de backup",
};

// Frase legible de una fila de auditoria. La regla pedida (seccion 7 del
// diseño): si quien actua ES el dirigente afectado, no repetir "para el
// dirigente X" (es el mismo); para cualquier otro rol (Administrador de
// Organizacion o de Plataforma actuando en nombre de alguien, carga
// asistida incluida) SI se aclara para quien fue.
export function describeAuditEntry(entry: AuditLogItem, names: AuditDisplayNames): string {
  // Si actorProfileId esta pero no aparece en el mapa, puede ser una cuenta
  // ya borrada O (mas comun) un perfil de OTRA organizacion que RLS no deja
  // ver desde aca (ej. el Administrador de Plataforma que creo esta
  // organizacion) -- "un usuario" es neutral y no afirma nada que no se
  // pueda confirmar.
  const actorName = entry.actorProfileId ? (names.actorNames.get(entry.actorProfileId) ?? "un usuario") : "Sistema";
  const actorLabel = entry.actorRole ? roleLabel(entry.actorRole) : "Usuario";
  const verb = ACTION_VERB[entry.action] ?? entry.action;
  const who = `${actorLabel} ${actorName}`;

  if (entry.action === "LOGIN" || entry.action === "LOGOUT") {
    return `${who} ${verb}.`;
  }

  if (entry.action === "ORGANIZATION_CREATED") {
    const orgName = names.organizationNames.get(entry.entityId ?? entry.organizationId);
    return `${who} ${verb}${orgName ? ` "${orgName}"` : ""}.`;
  }

  if (entry.action === "INVITATION_SENT") {
    if (entry.leaderId) {
      const leaderName = names.individualNames.get(entry.leaderId) ?? "un dirigente";
      return `${who} ${verb} al dirigente ${leaderName}.`;
    }
    const orgName = names.organizationNames.get(entry.organizationId);
    return `${who} ${verb} al administrador de ${orgName ?? "la organización"}.`;
  }

  let targetName: string | null = null;
  if (entry.action.includes("VEHICLE")) {
    targetName = entry.entityId ? (names.vehiclePlates.get(entry.entityId) ?? null) : null;
  } else if (entry.action.includes("LEADER")) {
    targetName = entry.leaderId ? (names.individualNames.get(entry.leaderId) ?? null) : null;
  } else if (entry.action.includes("POINTER")) {
    targetName = entry.pointerId ? (names.individualNames.get(entry.pointerId) ?? null) : null;
  } else if (entry.action.includes("PERSON")) {
    targetName = entry.personId ? (names.individualNames.get(entry.personId) ?? null) : null;
  }

  const base = `${who} ${verb}${targetName ? ` ${targetName}` : ""}`;

  const isDirectlyAboutLeader = entry.action.includes("LEADER");
  if (entry.actorRole === "leader" || isDirectlyAboutLeader || !entry.leaderId) {
    return `${base}.`;
  }

  const leaderName = names.individualNames.get(entry.leaderId);
  return leaderName ? `${base} para el dirigente ${leaderName}.` : `${base}.`;
}

// ---------------------------------------------------------------------------
// Columnas de la tabla de escritorio de Auditoria: tipo de evento (chip),
// registro afectado, contexto (el cambio concreto), usuario y origen.
// ---------------------------------------------------------------------------

export type AuditCategory = "create" | "edit" | "remove" | "restore" | "access" | "system";

export const CATEGORY_LABEL: Record<AuditCategory, string> = {
  create: "Alta",
  edit: "Edición",
  remove: "Baja",
  restore: "Restauración",
  access: "Acceso",
  system: "Sistema",
};

export function auditCategory(action: string): AuditCategory {
  if (action.startsWith("CREATE_")) return "create";
  if (action.startsWith("UPDATE_") || action.startsWith("REASSIGN_") || action === "SET_LEADER_ACCESS_STATUS") {
    return "edit";
  }
  if (action.startsWith("REMOVE_")) return "remove";
  if (action.startsWith("RESTORE_")) return "restore";
  if (action === "LOGIN" || action === "LOGOUT" || action === "LINK_LEADER_PROFILE") return "access";
  return "system";
}

const ENTITY_LABEL: Record<string, string> = {
  leader: "Dirigente",
  pointer: "Puntero",
  person: "Persona",
  vehicle: "Vehículo",
};

const CHANGED_FIELD_LABEL: Record<string, string> = {
  full_name: "Nombre",
  phone: "Teléfono",
  plate: "Patente",
};

function fieldText(value: unknown): string {
  return typeof value === "string" && value.trim() ? value : "—";
}

// Registro afectado: nombre de la persona / patente / etc.
export function auditSubject(entry: AuditLogItem, names: AuditDisplayNames): string {
  if (entry.action === "LOGIN" || entry.action === "LOGOUT") return "Sesión";
  if (entry.entityType === "vehicle") {
    return (entry.entityId && names.vehiclePlates.get(entry.entityId)) || "Vehículo";
  }
  if (entry.entityType === "person" && entry.personId) {
    return names.individualNames.get(entry.personId) ?? "Persona";
  }
  if (entry.entityType === "pointer" && entry.pointerId) {
    return names.individualNames.get(entry.pointerId) ?? "Puntero";
  }
  if (entry.entityType === "leader" && entry.leaderId) {
    return names.individualNames.get(entry.leaderId) ?? "Dirigente";
  }
  if (entry.entityType === "organization") {
    return names.organizationNames.get(entry.entityId ?? entry.organizationId) ?? "Organización";
  }
  return ACTION_FILTER_LABEL[entry.action] ?? entry.action;
}

// Contexto: el cambio concreto ("Teléfono: — → 381 476-3833") o donde quedo
// el registro ("Puntero · bajo Bordón, Facundo").
export function auditContext(entry: AuditLogItem, names: AuditDisplayNames): string {
  if (entry.action === "LOGIN") return "Inicio de sesión";
  if (entry.action === "LOGOUT") return "Cierre de sesión";

  if (entry.action.startsWith("UPDATE_") && entry.beforeData && entry.afterData) {
    const changes = Object.keys(CHANGED_FIELD_LABEL)
      .filter((key) => key in entry.afterData! && fieldText(entry.beforeData![key]) !== fieldText(entry.afterData![key]))
      .map((key) => `${CHANGED_FIELD_LABEL[key]}: ${fieldText(entry.beforeData![key])} → ${fieldText(entry.afterData![key])}`);
    if (changes.length > 0) return changes.join(" · ");
  }

  const entity = ENTITY_LABEL[entry.entityType];
  if (entity) {
    const leaderName = entry.leaderId ? names.individualNames.get(entry.leaderId) : null;
    // Un dirigente no cuelga de nadie: solo se aclara "bajo X" para el resto.
    return leaderName && entry.entityType !== "leader" ? `${entity} · bajo ${leaderName}` : entity;
  }

  return ACTION_FILTER_LABEL[entry.action] ?? entry.action;
}

// Desde donde se hizo: el celular (carga en calle) o la compu (oficina).
export function auditOrigin(userAgent: string | null): "Móvil" | "Escritorio" | null {
  if (!userAgent) return null;
  return /Mobi|Android|iPhone|iPad/i.test(userAgent) ? "Móvil" : "Escritorio";
}

// Tipo de registro afectado ("Puntero", "Vehículo"...) para el filtro "Entidad".
export function auditEntity(entry: AuditLogItem): string {
  return ENTITY_LABEL[entry.entityType] ?? "Sistema";
}
