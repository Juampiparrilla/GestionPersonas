import { Eyebrow } from "./Eyebrow";

// Resumen simetrico: columnas iguales con la cifra grande centrada y una
// nota al pie. Es la variante del Inicio del Dirigente (pocas cifras y
// espacio de sobra); el Administrador usa MetricsCard con cifra "hero".
export function SummaryCard({
  eyebrow,
  cells,
  footnote,
}: {
  eyebrow: string;
  cells: { label: string; value: number }[];
  footnote?: string;
}) {
  return (
    <section className="overflow-hidden rounded-[18px] border border-line bg-surface">
      <div className="px-[18px] pb-3 pt-4">
        <Eyebrow>{eyebrow}</Eyebrow>
      </div>
      <div
        className="grid border-t border-line-inner"
        style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}
      >
        {cells.map((cell, index) => (
          <div
            key={cell.label}
            className={`flex flex-col items-center gap-1 px-2 py-6 ${index > 0 ? "border-l border-line-inner" : ""}`}
          >
            <span className="text-[34px] font-semibold leading-none tracking-[-0.03em] text-ink">
              {cell.value.toLocaleString("es-AR")}
            </span>
            <span className="text-[13px] text-ink-2">{cell.label}</span>
          </div>
        ))}
      </div>
      {footnote ? (
        <p className="border-t border-line-inner px-4 py-3 text-center text-[13px] text-ink-2">
          {footnote}
        </p>
      ) : null}
    </section>
  );
}
