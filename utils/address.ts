const MAX_ADDRESS_LENGTH = 50;

// Letras (con acentos y ñ), numeros, un unico espacio entre palabras, y
// solamente estos caracteres especiales: - ( ) °. Maximo 50 caracteres.
export function formatAddressInput(raw: string): string {
  const allowedChars = raw.replace(/[^A-Za-zÁÉÍÓÚÜáéíóúüÑñ0-9()°\- ]/g, "");
  const singleSpaced = allowedChars.replace(/ {2,}/g, " ");
  return singleSpaced.replace(/^ +/, "").slice(0, MAX_ADDRESS_LENGTH);
}
