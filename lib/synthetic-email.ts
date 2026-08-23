// Cuando un dirigente no tiene (o no usa) correo electronico, su cuenta de
// Supabase Auth igual necesita un email unico como identificador interno.
// Se genera uno que la persona nunca ve ni necesita saber: inicia sesion con
// su DNI, no con esto (ver app/(auth)/login/actions.ts).
export function buildSyntheticEmail(normalizedDni: string, organizationId: string): string {
  return `dni-${normalizedDni}-${organizationId.slice(0, 8)}@dni.local`;
}
