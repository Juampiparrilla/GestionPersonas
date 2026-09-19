import { Search } from "lucide-react";

// Estados vacios: "sin resultados" (borde solido, lupa) y "base sin
// registros" (borde punteado, "0").
export function EmptyState({
  variant,
  title,
  children,
  action,
}: {
  variant: "search" | "blank";
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-[18px] bg-surface px-5 py-[26px] text-center ${
        variant === "blank" ? "border border-dashed border-line-dashed" : "border border-line"
      }`}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-ink-label">
        {variant === "search" ? (
          <Search className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        ) : (
          <span className="font-mono text-lg font-semibold">0</span>
        )}
      </span>
      <p className="text-[17px] font-semibold text-ink">{title}</p>
      {children ? <p className="text-sm text-ink-2">{children}</p> : null}
      {action}
    </div>
  );
}
