import { Eyebrow } from "./Eyebrow";

// Resumen simetrico: celdas iguales con la cifra grande centrada y una nota
// al pie. `columns` permite acomodar las celdas en una grilla (ej. 2x2).
// El Administrador y el Dirigente usan esta tarjeta en su Inicio.
export function SummaryCard({
  eyebrow,
  cells,
  footnote,
  columns,
}: {
  eyebrow: string;
  cells: { label: string; value: number }[];
  footnote?: string;
  columns?: number;
}) {
  const cols = columns ?? cells.length;

  return (
    <section className="overflow-hidden rounded-[18px] border border-line bg-surface">
      <div className="px-[18px] pb-3 pt-4">
        <Eyebrow>{eyebrow}</Eyebrow>
      </div>
      <div
        className="grid border-t border-line-inner"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {cells.map((cell, index) => (
          <div
            key={cell.label}
            className={`flex flex-col items-center gap-1 px-2 py-6 ${
              index % cols > 0 ? "border-l border-line-inner" : ""
            } ${index >= cols ? "border-t border-line-inner" : ""}`}
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
