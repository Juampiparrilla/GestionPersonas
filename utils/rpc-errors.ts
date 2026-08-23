// Traduce los codigos de error que devuelven las funciones RPC de Postgres
// (ver supabase/migrations/0001_init.sql) a mensajes que un usuario sin
// conocimientos tecnicos pueda entender. Nunca se debe mostrar error.message
// crudo en la interfaz.
export function friendlyRpcError(rawMessage: string | undefined | null): string {
  const message = rawMessage ?? "";

  if (message.includes("DNI_BLOCKED")) {
    return "Esta persona ya está registrada y no puede agregarse nuevamente.";
  }
  if (message.includes("PLATE_BLOCKED")) {
    return "Esa patente ya está registrada en otro vehículo.";
  }
  if (message.includes("CARGA_CERRADA")) {
    return "La carga está cerrada en este momento. No podés hacer cambios.";
  }
  if (message.includes("No autorizado")) {
    return "No tenés permiso para hacer esto.";
  }
  if (message.includes("PROFILE_ALREADY_LINKED")) {
    return "Esa cuenta ya está en uso por otro dirigente.";
  }
  return "Ocurrió un problema y no pudimos guardar los cambios. Probá de nuevo en un momento.";
}
