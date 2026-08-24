// Mejor esfuerzo para convertir un telefono cargado en el formulario (con o
// sin codigo de pais, con o sin el "15" de celular) a lo que necesita un
// link wa.me para Argentina: codigo de pais 54 + "9" (celular) + numero,
// todo junto. Es un mejor esfuerzo: si el numero no tiene el codigo de area
// completo (ej. "155608197" sin area), el link puede no encontrar el
// contacto correcto -- el Superadmin puede reintentar con el numero
// completo.
//
// OJO: wa.me REQUIERE un numero de telefono para funcionar. No existe un
// link de WhatsApp que abra un selector de contacto generico sin numero
// (se probo esa idea y no anda) -- por eso, sin telefono cargado, no hay
// forma de armar un link de WhatsApp: la alternativa es copiar el mensaje
// (ver InviteButton.tsx).
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
