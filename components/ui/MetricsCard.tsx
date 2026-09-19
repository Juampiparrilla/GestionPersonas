import { Eyebrow } from "./Eyebrow";

// Tarjeta de metricas: reemplaza a las seis tarjetas apiladas. Cabecera con
// la cifra hero + nota a la derecha, y una fila de celdas (4 columnas).
export function MetricsCard({
  eyebrow,
  total,
  note,
  cells,
}: {
  eyebrow: string;
  total: number;
  note?: React.ReactNode;
  cells: { label: string; value: number }[];
}) {
  return (
    <section className="overflow-hidden rounded-[18px] border border-line bg-surface">
      <div className="flex items-start justify-between gap-3 px-[18px] pb-3 pt-4">
        <div className="flex flex-col gap-1">
          <Eyebrow>{eyebrow}</Eyebrow>
          <p className="text-[40px] font-semibold leading-none tracking-[-0.03em] text-ink">
            {total.toLocaleString("es-AR")}
          </p>
        </div>
        {note ? <p className="text-right text-[13px] text-ink-2">{note}</p> : null}
      </div>
      <div
        className="grid border-t border-line-inner"
        style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}
      >
        {cells.map((cell, index) => (
          <div
            key={cell.label}
            className={`flex flex-col items-center px-2 py-3 ${index > 0 ? "border-l border-line-inner" : ""}`}
          >
            <span className="text-xl font-semibold text-ink">
              {cell.value.toLocaleString("es-AR")}
            </span>
            <span className="text-[11px] text-ink-2">{cell.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
