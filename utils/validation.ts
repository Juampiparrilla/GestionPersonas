import { isValidDniFormat } from "./dni";
import { normalizePhone, PHONE_EXAMPLE } from "./phone";

// Validaciones de campo compartidas entre el navegador (mensaje al salir del
// campo, boton de guardar deshabilitado) y el servidor (las Server Actions
// las repiten: el navegador nunca es la unica defensa). Devuelven el mensaje
// de error o null si el valor esta bien.

export function validateFullName(value: string): string | null {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "Falta el nombre.";
  if (words.length < 2) return "Cargá apellido y nombre.";
  return null;
}

export function validateDni(value: string): string | null {
  if (!value.trim()) return "Falta el DNI.";
  if (!isValidDniFormat(value)) return "El DNI tiene que tener 7 u 8 números.";
  return null;
}

// Opcional: vacio es valido.
export function validatePhone(value: string): string | null {
  if (!value.trim()) return null;
  return normalizePhone(value) ? null : `El teléfono no es válido. Ejemplo: ${PHONE_EXAMPLE}.`;
}

const PLATE_LENGTHS = [6, 7];

export function validatePlate(value: string): string | null {
  const plate = value.trim();
  if (!plate) return "Falta la patente.";
  if (!PLATE_LENGTHS.includes(plate.length)) return "La patente tiene 6 o 7 caracteres.";
  return null;
}
