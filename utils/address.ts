const MAX_ADDRESS_LENGTH = 100;

// Texto libre (calle, numero, barrio) -- sin restriccion de caracteres mas
// alla de un tope de largo y no dejar que arranque con espacios.
export function formatAddressInput(raw: string): string {
  return raw.replace(/^ +/, "").slice(0, MAX_ADDRESS_LENGTH);
}
