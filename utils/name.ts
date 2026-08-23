const MAX_NAME_LENGTH = 50;

// Solo letras (con acentos y ñ) y espacios, un unico espacio entre palabras,
// sin espacios al principio, maximo 50 caracteres. Se aplica mientras el
// usuario escribe.
export function formatNameInput(raw: string): string {
  const lettersOnly = raw.replace(/[^A-Za-zÁÉÍÓÚÜáéíóúüÑñ ]/g, "");
  const singleSpaced = lettersOnly.replace(/ {2,}/g, " ");
  return singleSpaced.replace(/^ +/, "").slice(0, MAX_NAME_LENGTH);
}
