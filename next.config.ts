import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Politica de contenido: sin nonces (las paginas estaticas como /login no
// pueden llevarlos), asi que los scripts inline de Next se permiten con
// 'unsafe-inline'. Igual cierra lo importante: nada de plugins, nadie puede
// meter la app en un iframe, los formularios solo se envian a la propia app
// y el navegador solo habla con la propia app y con Supabase.
// En desarrollo hace falta 'unsafe-eval' (React lo usa para el overlay).
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // pdfmake/pdfkit resuelven sus archivos de fuentes estandar (.afm) con
  // rutas basadas en __dirname en tiempo de ejecucion; si el bundler los
  // empaqueta, __dirname deja de apuntar al node_modules real y esas rutas
  // se rompen. Se los deja "externos" para que Node los cargue directo del
  // filesystem, igual que hace fuera de Next.js.
  serverExternalPackages: ["pdfmake", "pdfkit"],
  // Sin esto, un <Link> que ya se prefeteo por estar en pantalla queda
  // "congelado" en el cache del lado del cliente por 5 minutos por defecto,
  // aunque la pagina sea dinamica (staleTimes.dynamic=0 solo aplica a
  // navegaciones NO prefeteadas). Eso hacia que, por ejemplo, un dirigente
  // que ya tenia "Mis Punteros" prefeteado siguiera viendo "la carga esta
  // pausada" un rato despues de que el Superadmin le reabriera el acceso,
  // hasta hacer un refresh manual.
  //
  // OJO: Next 16 exige `static >= 30` (0 tira error de validacion en el
  // build y esta seccion entera queda descartada -- volviendo al default
  // real de 5 minutos, que es justo el bug que se queria evitar). 30 es el
  // minimo permitido, igual muy por debajo del default. `dynamic: 0`
  // restaura el default de no cachear nada para paginas dinamicas (todas
  // las de esta app dependen de la sesion) -- el valor anterior (30) hacia
  // exactamente lo contrario de lo buscado.
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 30,
    },
  },
};

export default nextConfig;
