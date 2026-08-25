import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: number;
  icon?: LucideIcon;
  hint?: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-1 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-center gap-1.5">
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" /> : null}
        <span className="text-sm text-zinc-600">{label}</span>
      </div>
      <div>
        <span className="text-2xl font-semibold text-zinc-900">{value.toLocaleString("es-AR")}</span>
        {hint ? <p className="text-xs text-zinc-400">{hint}</p> : null}
      </div>
    </div>
  );
}
