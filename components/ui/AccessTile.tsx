import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { rowCardClass } from "./styles";

// Tile de acceso del Inicio: tile de icono arriba, etiqueta abajo.
export function AccessTile({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <Link href={href} className={`${rowCardClass} flex min-h-[88px] flex-col justify-between gap-[22px] p-3.5`}>
      <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-muted text-ink-label">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span className="text-[15px] font-semibold text-ink">{label}</span>
    </Link>
  );
}
