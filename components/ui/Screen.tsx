import { ScreenHeader } from "./ScreenHeader";

// Estructura comun de todas las pantallas: cabecera fija, contenido
// scrolleable y (opcional) barra inferior fija. En movil la columna se centra
// y se limita a ~448px.
//
// `shell`: pantalla del Administrador de Organizacion, que en escritorio
// (>= 1024px) vive dentro del armazon con barra lateral (components/desktop):
// ahi se ocultan la cabecera y la barra inferior, y el contenido ocupa todo
// el ancho con un titulo de pantalla propio.
export function Screen({
  title,
  subtitle,
  backHref,
  headerRight,
  headerExtra,
  bar,
  barTall = false,
  flush = false,
  shell = false,
  desktopNote,
  desktopContent = false,
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
  shell?: boolean;
  // Texto gris al lado del titulo de escritorio ("3 registros").
  desktopNote?: string;
  // Escritorio: el contenido maneja su propio titulo y su propio padding
  // (pantallas con tabla + panel lateral).
  desktopContent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`mx-auto flex w-full max-w-[448px] flex-1 flex-col bg-app ${
        shell ? "lg:mx-0 lg:max-w-none" : ""
      }`}
    >
      {title || backHref || headerRight ? (
        <ScreenHeader
          title={title}
          subtitle={subtitle}
          backHref={backHref}
          right={headerRight}
          className={shell ? "lg:hidden" : ""}
        >
          {headerExtra}
        </ScreenHeader>
      ) : null}
      <main
        className={`flex flex-1 flex-col gap-4 px-5 pt-4 ${
          bar ? (barTall ? "pb-40" : "pb-32") : flush ? "pb-0" : "pb-8"
        } ${shell ? (desktopContent ? "lg:gap-0 lg:p-0" : "lg:gap-5 lg:px-6 lg:pb-6 lg:pt-5") : ""}`}
      >
        {shell && title && !desktopContent ? (
          <div className="hidden items-baseline gap-3 lg:flex">
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">{title}</h1>
            {desktopNote ? <span className="text-[15px] text-ink-2">{desktopNote}</span> : null}
          </div>
        ) : null}
        {children}
      </main>
      {bar ? <div className={shell ? "lg:hidden" : undefined}>{bar}</div> : null}
    </div>
  );
}
