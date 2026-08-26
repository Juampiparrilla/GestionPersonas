import "server-only";

import { Resend } from "resend";

// Se construye 1 sola vez (mismo patron que lib/supabase/admin.ts): la API
// key es server-only, nunca NEXT_PUBLIC_, y nunca se usa desde un Client
// Component (falla el build si algo lo intenta importar de ahi).
let client: Resend | null = null;

export function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Falta configurar RESEND_API_KEY en las variables de entorno del servidor.");
  }
  if (!client) {
    client = new Resend(apiKey);
  }
  return client;
}

// onboarding@resend.dev funciona sin verificar un dominio propio -- sirve
// para arrancar. Si mas adelante se verifica un dominio en Resend, alcanza
// con setear RESEND_FROM_EMAIL sin tocar codigo.
export const REPORT_EMAIL_FROM = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
