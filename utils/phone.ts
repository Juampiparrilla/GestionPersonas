// Acepta los formatos que se usan en Argentina: "+54 381 5608197" (16
// caracteres, el mas largo), "3815608197" o "155608197". Se permiten
// digitos, espacios y un '+' solo al principio; el largo maximo es el de
// "+54 381 5608197".
const MAX_PHONE_LENGTH = "+54 381 5608197".length;

export function formatPhoneInput(raw: string): string {
  const withoutInvalidChars = raw.replace(/[^\d+ ]/g, "");
  const plusOnlyAtStart = withoutInvalidChars.replace(/(?!^)\+/g, "");
  return plusOnlyAtStart.slice(0, MAX_PHONE_LENGTH);
}
