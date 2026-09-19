// Usado por los loading.tsx de cada seccion -- Next.js lo muestra
// automaticamente mientras el Server Component de la pagina destino
// termina de leer datos. Skeletons con la geometria real de la pantalla
// (barras muted del alto de la linea y el radio de la tarjeta), no un
// spinner centrado de pantalla completa.
function Bar({ className }: { className: string }) {
  return <div className={`animate-[skeleton-pulse_1.4s_ease-in-out_infinite] bg-muted ${className}`} />;
}

export function PageLoading() {
  return (
    <div
      className="mx-auto flex w-full max-w-[448px] flex-1 flex-col gap-4 px-5 pt-5"
      role="status"
      aria-label="Cargando"
    >
      <Bar className="h-10 w-2/3 rounded-xl" />
      <Bar className="h-12 w-full rounded-[14px]" />
      <Bar className="h-36 w-full rounded-[18px]" />
      <div className="grid grid-cols-2 gap-2.5">
        <Bar className="h-[88px] rounded-2xl" />
        <Bar className="h-[88px] rounded-2xl" />
        <Bar className="h-[88px] rounded-2xl" />
        <Bar className="h-[88px] rounded-2xl" />
      </div>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
