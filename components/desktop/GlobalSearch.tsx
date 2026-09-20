"use client";

import { Car, Search, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  searchDirectoryAction,
  type SearchResultKind,
  type SearchState,
} from "@/features/search/actions";

const KIND_ICON: Record<SearchResultKind, typeof UserRound> = {
  leader: UserRound,
  pointer: UserRound,
  person: UserRound,
  vehicle: Car,
};

const EMPTY: SearchState = { error: null, results: [], query: null };
const DEBOUNCE_MS = 300;
const MIN_LENGTH = 3;

// Buscador global de la barra superior (DNI, nombre o patente). ⌘K / Ctrl+K
// lleva el foco al campo.
export function GlobalSearch() {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>(EMPTY);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < MIN_LENGTH) return;
    let cancelled = false;
    const timeout = setTimeout(async () => {
      const formData = new FormData();
      formData.set("query", term);
      const result = await searchDirectoryAction(EMPTY, formData);
      if (!cancelled) setState(result);
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  const term = query.trim();
  const showPanel = open && term.length >= MIN_LENGTH && state.query === term;

  return (
    <div ref={containerRef} className="relative w-full max-w-[460px]">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-ph">
        <Search className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <input
        ref={inputRef}
        type="text"
        value={query}
        maxLength={60}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            inputRef.current?.blur();
          }
        }}
        placeholder="Buscar por nombre, DNI o patente"
        aria-label="Buscar en toda la base"
        className="h-9 w-full rounded-[10px] border border-line-input bg-muted/60 pl-9 pr-14 text-sm text-ink placeholder:text-ink-ph focus:border-ink focus:bg-surface focus:outline-none"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-line-input bg-surface px-1.5 py-0.5 font-mono text-[11px] text-ink-2">
        ⌘K
      </kbd>

      {showPanel ? (
        <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-[420px] overflow-y-auto rounded-2xl border border-line bg-surface shadow-panel">
          {state.error ? (
            <p role="alert" className="p-4 text-sm text-err-text">
              {state.error}
            </p>
          ) : state.results.length === 0 ? (
            <p className="p-4 text-sm text-ink-2">No encontramos nada para “{state.query}”.</p>
          ) : (
            state.results.map((result, index) => {
              const Icon = KIND_ICON[result.kind];
              return (
                <div
                  key={`${result.kind}-${result.id}`}
                  className={`flex items-start gap-3 px-4 py-3 ${index > 0 ? "border-t border-line-row" : ""}`}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-2" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{result.title}</p>
                    <p className="text-[13px] text-ink-2">{result.subtitle}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
