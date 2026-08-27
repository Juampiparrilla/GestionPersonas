import { Spinner } from "./Spinner";

// Usado por los loading.tsx de cada seccion -- Next.js lo muestra
// automaticamente mientras el Server Component de la pagina destino
// termina de leer datos, en vez de dejar la pantalla anterior "colgada"
// sin ningun indicio de que algo esta pasando.
export function PageLoading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-zinc-50 p-6">
      <Spinner className="h-8 w-8 text-zinc-400" />
      <p className="text-sm text-zinc-500">Cargando…</p>
    </div>
  );
}
