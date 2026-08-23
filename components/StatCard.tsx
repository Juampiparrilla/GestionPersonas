export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-4">
      <span className="text-sm text-zinc-600">{label}</span>
      <span className="text-2xl font-semibold text-zinc-900">{value.toLocaleString("es-AR")}</span>
    </div>
  );
}
