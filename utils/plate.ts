const MAX_PLATE_LENGTH = 10;

// Solo letras y numeros, siempre en MAYUSCULA (los formatos de patente
// argentina varian: "ABC123" viejo, "AB123CD" nuevo, motos "A123BCD"), asi
// que no se fuerza un patron exacto, solo se limpia y normaliza.
export function formatPlateInput(raw: string): string {
  return raw
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, MAX_PLATE_LENGTH);
}
