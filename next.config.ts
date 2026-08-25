import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfmake/pdfkit resuelven sus archivos de fuentes estandar (.afm) con
  // rutas basadas en __dirname en tiempo de ejecucion; si el bundler los
  // empaqueta, __dirname deja de apuntar al node_modules real y esas rutas
  // se rompen. Se los deja "externos" para que Node los cargue directo del
  // filesystem, igual que hace fuera de Next.js.
  serverExternalPackages: ["pdfmake", "pdfkit"],
};

export default nextConfig;
