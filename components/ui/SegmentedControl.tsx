"use client";

// Control segmentado (reemplaza a las tarjetas de radio): riel gris con el
// segmento activo en tinta. Alto de 42px por segmento.
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-1.5 rounded-[14px] border border-line-input bg-track p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`h-[42px] rounded-[10px] text-sm transition-colors duration-200 ease-out ${
              active ? "bg-ink font-semibold text-white" : "font-medium text-ink-label"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
