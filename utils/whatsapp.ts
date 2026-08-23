// Link de "compartir" generico de WhatsApp: abre WhatsApp con el mensaje ya
// escrito, sin destinatario. El Superadmin elige a quien mandarselo desde
// adentro de WhatsApp (evita depender de tener el numero de telefono del
// dirigente cargado y bien formateado).
export function buildWhatsAppShareLink(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
