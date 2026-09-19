// Telefonos de Tucuman (Argentina). El numero nacional siempre tiene 10
// digitos: codigo de area + abonado. San Miguel de Tucuman es 381 (3 + 7
// digitos, "381 476-3833"); el interior tiene codigos de 4 digitos (3863,
// 3865, 3868...) y abonados de 6 ("3865 42-1234").
//
// La gente lo escribe de muchas formas: "3814763833", "381 476-3833",
// "0381 15 476-3833", "+54 9 381 476-3833", o solo "4763833" (sin codigo de
// area). Todo se normaliza al mismo formato de pantalla.

const NATIONAL_LENGTH = 10;
const LOCAL_LENGTH = 7;
// Largo maximo de lo que se acepta escribir/pegar antes de normalizar
// ("5493814763833" = +54 9 + 10 digitos).
const MAX_RAW_LENGTH = 13;
const DEFAULT_AREA_CODE = "381";

// Saca los prefijos que no son parte del numero nacional: +54, el 9 de los
// celulares, el 0 de discado interurbano y el "15" de celular local.
function stripPrefixes(digits: string): string {
  let result = digits;

  if (result.startsWith("54") && result.length > NATIONAL_LENGTH) {
    result = result.slice(2);
  }
  if (result.startsWith("9") && result.length > NATIONAL_LENGTH) {
    result = result.slice(1);
  }
  if (result.startsWith("0")) {
    result = result.slice(1);
  }
  // "381 15 4763833" / "3865 15 421234": el 15 va justo despues del codigo
  // de area y no forma parte del abonado.
  if (result.length === NATIONAL_LENGTH + 2) {
    const areaLength = areaLengthOf(result);
    if (result.slice(areaLength, areaLength + 2) === "15") {
      result = result.slice(0, areaLength) + result.slice(areaLength + 2);
    }
  }
  return result;
}

// 381 es capital (3 digitos); el resto de los codigos de Tucuman (38xx) son
// de 4 digitos.
function areaLengthOf(digits: string): number {
  return digits.startsWith("38") && digits[2] !== undefined && digits[2] !== "1" ? 4 : 3;
}

function groupDigits(digits: string): string {
  const areaLength = areaLengthOf(digits);
  const area = digits.slice(0, areaLength);
  const subscriber = digits.slice(areaLength);
  if (!subscriber) return area;

  // Abonado de 7 digitos (area 3): XXX-XXXX. De 6 digitos (area 4): XX-XXXX.
  const splitAt = areaLength === 3 ? 3 : 2;
  if (subscriber.length <= splitAt) return `${area} ${subscriber}`;
  return `${area} ${subscriber.slice(0, splitAt)}-${subscriber.slice(splitAt)}`;
}

// Formato mientras se escribe: solo digitos, agrupados a medida que se
// completa. Si se pega un numero con prefijos (+54 9 ...) se limpian.
export function formatPhoneInput(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  // Ningun numero de Tucuman arranca con 0 (es el 0 de discado interurbano).
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (!digits) return "";

  if (digits.length <= NATIONAL_LENGTH) return groupDigits(digits);

  const national = stripPrefixes(digits);
  if (national.length <= NATIONAL_LENGTH) return groupDigits(national);
  // Todavia no se puede normalizar (ej. falta el ultimo digito de un numero
  // con "15"): se deja seguir escribiendo sin agrupar.
  return digits.slice(0, MAX_RAW_LENGTH);
}

// Devuelve el telefono en formato de pantalla ("381 476-3833"), o null si no
// es un numero valido. Un abonado de 7 digitos sin codigo de area se asume
// de San Miguel de Tucuman (381).
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  const national = stripPrefixes(digits);
  if (national.length === LOCAL_LENGTH) {
    return groupDigits(DEFAULT_AREA_CODE + national);
  }
  if (national.length === NATIONAL_LENGTH) {
    return groupDigits(national);
  }
  return null;
}

// Para mostrar un telefono guardado (puede haberse cargado antes de que
// existiera este formato): si no se puede normalizar se muestra tal cual.
export function formatPhoneDisplay(raw: string | null | undefined): string {
  if (!raw) return "";
  return normalizePhone(raw) ?? raw;
}

export const PHONE_EXAMPLE = "381 476-3833";
