import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { btnIcon } from "./styles";

export function BackButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      aria-label="Volver"
      className={`${btnIcon} before:absolute before:-inset-1 before:content-['']`}
    >
      <ArrowLeft className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
    </Link>
  );
}

// Cabecera fija: boton de icono "volver" a la izquierda del titulo (nunca un
// link de texto a la derecha), separada del contenido por 1px.
export function ScreenHeader({
  title,
  subtitle,
  backHref,
  right,
  children,
}: {
  title?: string;
  subtitle?: string;
  backHref?: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line-head bg-app px-5 pb-3 pt-[max(16px,env(safe-area-inset-top))]">
      <div className="flex items-center gap-3">
        {backHref ? <BackButton href={backHref} /> : null}
        {title ? (
          <div className="min-w-0 flex-1">
            <h1 className="text-[21px] font-semibold leading-[1.15] tracking-[-0.015em] text-ink">
              {title}
            </h1>
            {subtitle ? (
              <p className="truncate font-mono text-[13px] font-medium text-ink-2">{subtitle}</p>
            ) : null}
          </div>
        ) : (
          <div className="flex-1" />
        )}
        {right}
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
    </header>
  );
}
