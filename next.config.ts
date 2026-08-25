import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  // hasta hacer un refresh manual. staleTimes.static=0 saca ese cache para
  // paginas dinamicas (todas las de esta app, todas dependen de la sesion).
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 0,
    },
  },
};

export default nextConfig;
