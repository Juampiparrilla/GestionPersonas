import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { Avatar } from "./Avatar";
import { rowCardClass } from "./styles";

// Fila de lista: avatar + nombre (con chevron) + linea mono (DNI · telefono)
// + chips. Con `href` navega; con `onToggle` se expande y muestra `children`
// (acciones de la fila: editar, quitar...).
export function EntityRow({
  name,
  meta,
  chips,
  href,
  expanded = false,
  onToggle,
  avatarName,
  children,
}: {
  name: string;
  meta?: string;
  chips?: React.ReactNode;
  href?: string;
  expanded?: boolean;
  onToggle?: () => void;
  avatarName?: string;
  children?: React.ReactNode;
}) {
  const body = (
    <>
      <Avatar name={avatarName ?? name} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-base font-semibold text-ink">{name}</p>
          {href || onToggle ? (
            <ChevronRight
              className={`h-4 w-4 shrink-0 text-ink-ph transition-transform duration-200 ease-out ${expanded ? "rotate-90" : ""}`}
              aria-hidden="true"
            />
          ) : null}
        </div>
        {meta ? <p className="font-mono text-[13px] font-medium text-ink-2">{meta}</p> : null}
        {chips ? <div className="mt-1 flex flex-wrap gap-1.5">{chips}</div> : null}
      </div>
    </>
  );

  const rowClass = "flex w-full items-start gap-3 p-3.5 text-left";

  return (
    <div className={rowCardClass}>
      {href ? (
        <Link href={href} className={rowClass}>
          {body}
        </Link>
      ) : onToggle ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className={rowClass}
        >
          {body}
        </button>
      ) : (
        <div className={rowClass}>{body}</div>
      )}
      {expanded && children ? (
        <div className="border-t border-line-inner p-3.5">{children}</div>
      ) : null}
    </div>
  );
}
