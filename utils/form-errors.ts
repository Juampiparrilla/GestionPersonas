// Errores por campo: el servidor devuelve un mensaje por cada campo con
// problema (clave = name del input) y el formulario marca ese campo.
export type FieldErrors = Partial<Record<string, string>>;

// Arma FieldErrors solo con los campos que tienen error.
export function collectFieldErrors(checks: Record<string, string | null>): FieldErrors | null {
  const errors: FieldErrors = {};
  for (const [field, message] of Object.entries(checks)) {
    if (message) errors[field] = message;
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

// Errores de las funciones RPC que corresponden a UN campo concreto (en vez
// de a todo el formulario). Devuelve null si el error no es de un campo.
export function rpcFieldErrors(rawMessage: string | undefined | null): FieldErrors | null {
  const message = rawMessage ?? "";
  if (message.includes("DNI_BLOCKED")) {
    return { dni: "Este DNI ya está registrado y no puede agregarse de nuevo." };
  }
  if (message.includes("PLATE_BLOCKED")) {
    return { plate: "Esa patente ya está registrada en otro vehículo." };
  }
  return null;
}

// Texto del aviso de resumen que va arriba del formulario.
export function fieldErrorsSummary(errors: FieldErrors | undefined): string | null {
  const count = errors ? Object.keys(errors).length : 0;
  if (count === 0) return null;
  return count === 1 ? "Revisá el campo marcado abajo." : `Revisá los ${count} campos marcados abajo.`;
}
