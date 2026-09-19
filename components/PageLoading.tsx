import { Spinner } from "./Spinner";

// Usado por los loading.tsx de cada seccion -- Next.js lo muestra
// automaticamente mientras el Server Component de la pagina destino
// termina de leer datos, en vez de dejar la pantalla anterior "colgada"
// sin ningun indicio de que algo esta pasando.
export function PageLoading() {
  return (
    <div className="mx-auto flex w-full max-w-[448px] flex-1 flex-col items-center justify-center gap-3 px-5">
      <Spinner className="h-9 w-9 text-accent" />
      <p className="text-sm text-ink-2">Cargando…</p>
    </div>
  );
}
