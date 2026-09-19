import { ScreenHeader } from "./ScreenHeader";

// Estructura comun de todas las pantallas: cabecera fija, contenido
// scrolleable y (opcional) barra inferior fija. La columna se centra y se
// limita a ~448px: el breakpoint de escritorio no esta diseñado.
export function Screen({
  title,
  subtitle,
  backHref,
  headerRight,
  headerExtra,
  bar,
  barTall = false,
  flush = false,
  children,
}: {
  title?: string;
  subtitle?: string;
  backHref?: string;
  headerRight?: React.ReactNode;
  headerExtra?: React.ReactNode;
  bar?: React.ReactNode;
  barTall?: boolean;
  // Sin padding inferior: para pantallas cuyo formulario ya trae su propio
  // pie pegado abajo (FormFooter).
  flush?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[448px] flex-1 flex-col bg-app">
      {title || backHref || headerRight ? (
        <ScreenHeader title={title} subtitle={subtitle} backHref={backHref} right={headerRight}>
          {headerExtra}
        </ScreenHeader>
      ) : null}
      <main
        className={`flex flex-1 flex-col gap-4 px-5 pt-4 ${
          bar ? (barTall ? "pb-40" : "pb-32") : flush ? "pb-0" : "pb-8"
        }`}
      >
        {children}
      </main>
      {bar}
    </div>
  );
}
