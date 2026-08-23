// Mejor esfuerzo para convertir un telefono cargado en el formulario (con o
// sin codigo de pais, con o sin el "15" de celular) al formato que necesita
// un link wa.me para Argentina: codigo de pais 54 + "9" (celular) + numero,
// todo junto y sin simbolos. Si el numero cargado no incluye el codigo de
// area (ej. alguien tipeo solo "155608197"), el link puede no encontrar el
// contacto correcto -- no hay forma de adivinar el area sin mas datos, asi
// que el Superadmin puede reintentar cargando el numero completo.
export function toWhatsAppNumber(rawPhone: string): string {
  let digits = rawPhone.replace(/\D/g, "");

  if (digits.startsWith("54")) {
    digits = digits.slice(2);
  }
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  if (digits.startsWith("15")) {
    digits = digits.slice(2);
  }

  return `549${digits}`;
}

export function buildWhatsAppInviteLink(phone: string, message: string): string {
  return `https://wa.me/${toWhatsAppNumber(phone)}?text=${encodeURIComponent(message)}`;
}
