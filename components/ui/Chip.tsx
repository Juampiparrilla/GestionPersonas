// Chips de conteo. Con datos: fondo muted. En cero: redactados en negativo
// ("sin personas") -- nunca "0 personas".
export function Chip({
  children,
  empty = false,
}: {
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <span
      className={`rounded-[7px] px-2 py-[3px] text-[12px] font-medium ${
        empty ? "bg-[#f7f7f4] text-ink-ph" : "bg-muted text-ink-label"
      }`}
    >
      {children}
    </span>
  );
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count.toLocaleString("es-AR")} ${count === 1 ? singular : plural}`;
}

// "1 puntero" / "sin punteros"
export function CountChip({
  count,
  singular,
  plural,
}: {
  count: number;
  singular: string;
  plural: string;
}) {
  return count === 0 ? (
    <Chip empty>sin {plural}</Chip>
  ) : (
    <Chip>{pluralize(count, singular, plural)}</Chip>
  );
}

// Chips de rango / pestaña (Hoy · 7 días · Todo, Punteros · Personas ...).
export function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-[44px] shrink-0 rounded-[9px] px-3 py-[7px] text-[13px] transition-colors duration-150 ease-out ${
        active
          ? "bg-ink font-semibold text-white"
          : "border border-line-input bg-surface font-medium text-ink-label active:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}
