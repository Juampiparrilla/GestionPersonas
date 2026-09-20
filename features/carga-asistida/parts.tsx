"use client";

import { useMemo } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { inputClass, linkActionClass } from "@/components/ui/styles";

export type LeaderOption = { id: string; fullName: string };
export type PointerOption = { id: string; fullName: string };
export type LeaderPointerGroup = { leaderId: string; leaderName: string; pointers: PointerOption[] };
export type Operation = "pointer" | "person" | "vehicle";

export const OPERATIONS: { value: Operation; label: string }[] = [
  { value: "pointer", label: "Puntero" },
  { value: "person", label: "Persona" },
  { value: "vehicle", label: "Vehículo" },
];

export function Autocomplete<T extends { id: string; fullName: string }>({
  query,
  onQueryChange,
  onSelect,
  options,
  placeholder,
  label,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (option: T) => void;
  options: T[];
  placeholder: string;
  label: string;
}) {
  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return options.filter((option) => option.fullName.toLowerCase().includes(normalized)).slice(0, 8);
  }, [query, options]);

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className={inputClass}
      />
      {matches.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          {matches.map((option, index) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option)}
              className={`flex min-h-[48px] w-full items-center gap-3 px-3.5 py-2 text-left text-[15px] font-semibold text-ink active:bg-muted lg:hover:bg-muted ${
                index > 0 ? "border-t border-line-inner" : ""
              }`}
            >
              <Avatar name={option.fullName} size="sm" />
              {option.fullName}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SelectedCard({
  eyebrow,
  name,
  onChange,
}: {
  eyebrow: string;
  name: string;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[13px] border border-line-input bg-surface px-3 py-[9px]">
      <Avatar name={name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-ink-3">
          {eyebrow}
        </p>
        <p className="truncate text-[15px] font-semibold text-ink">{name}</p>
      </div>
      <button type="button" onClick={onChange} className={`${linkActionClass} min-h-[44px] px-1`}>
        Cambiar
      </button>
    </div>
  );
}
