import "server-only";

// Verificacion de Cloudflare Turnstile (CAPTCHA gratuito, sin acertijos en la
// mayoria de los casos). Es OPCIONAL: sin las dos claves el login funciona
// igual, solo con el limite de intentos.
export function isTurnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

export async function verifyTurnstile(token: string, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      cache: "no-store",
    });
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch (error) {
    console.error("[turnstile] no se pudo verificar:", error);
    // Cloudflare caido: no se deja a todos afuera, el limite de intentos
    // sigue protegiendo.
    return true;
  }
}
