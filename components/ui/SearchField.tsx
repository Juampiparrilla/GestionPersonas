import { Search, X } from "lucide-react";

// Buscador de listas (46px). Conserva el termino y muestra ✕ para limpiarlo.
export function SearchField({
  value,
  onChange,
  placeholder,
  label = "Buscar",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-ink-ph">
        <Search className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-[46px] w-full rounded-[14px] border border-line-input bg-surface pl-10 pr-11 text-base text-ink placeholder:text-ink-ph focus:border-[1.5px] focus:border-ink focus:outline-none"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpiar búsqueda"
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-2"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
