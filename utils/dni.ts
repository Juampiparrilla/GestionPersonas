// Misma normalizacion que fn_normalize_dni() en supabase/migrations/0001_init.sql:
// solo digitos, para que "20.123.456" y "20123456" se comparen igual.
export function normalizeDni(rawDni: string): string {
  return rawDni.replace(/\D/g, "");
}

// DNI argentino: 7 u 8 digitos.
export function isValidDniFormat(rawDni: string): boolean {
  const normalized = normalizeDni(rawDni);
  return normalized.length === 7 || normalized.length === 8;
}

// Formatea digitos sueltos con puntos como separador de miles, agrupando de
// derecha a izquierda (ej. "12345678" -> "12.345.678", "1234567" -> "1.234.567").
// Se usa mientras el usuario escribe; el valor real que compara el backend
// siempre pasa por normalizeDni() primero.
export function formatDniInput(rawDni: string): string {
  const digits = normalizeDni(rawDni).slice(0, 8);
  const reversed = digits.split("").reverse().join("");
  const grouped = reversed.match(/.{1,3}/g)?.join(".") ?? "";
  return grouped.split("").reverse().join("");
}
