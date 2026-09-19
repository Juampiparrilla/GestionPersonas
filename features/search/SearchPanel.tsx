"use client";

import { Car, Search, UserRound } from "lucide-react";
import { useActionState, useCallback, useState } from "react";

import { Spinner } from "@/components/Spinner";
import { Sheet } from "@/components/ui/Sheet";
import { btnPrimary, inputClass } from "@/components/ui/styles";

import { searchDirectoryAction, type SearchResultKind, type SearchState } from "./actions";

const initialState: SearchState = { error: null, results: [], query: null };

const KIND_ICON: Record<SearchResultKind, typeof UserRound> = {
  leader: UserRound,
  pointer: UserRound,
  person: UserRound,
  vehicle: Car,
};

// Fila de busqueda de 48px en el Inicio; al tocarla se abre la hoja con el
// buscador de toda la base (DNI, nombre o patente).
export function SearchPanel() {
  const [state, formAction, pending] = useActionState(searchDirectoryAction, initialState);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 w-full items-center gap-2.5 rounded-[14px] border border-line-input bg-surface px-3.5 text-left text-base text-ink-ph"
      >
        <Search className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
        Buscar en toda la base
      </button>

      <Sheet open={open} onClose={close} title="Buscar en toda la base">
        <div className="flex flex-col gap-4 pb-8">
          <p className="text-sm text-ink-2">Ingresá un DNI, un nombre o una patente.</p>

          <form action={formAction} className="flex flex-col gap-2.5">
            <input
              type="text"
              name="query"
              placeholder="DNI, nombre o patente"
              maxLength={60}
              autoFocus
              className={inputClass}
            />
            <button type="submit" disabled={pending} className={btnPrimary}>
              {pending ? (
                <>
                  <Spinner className="h-4 w-4" /> Buscando…
                </>
              ) : (
                "Buscar"
              )}
            </button>
          </form>

          {state.error ? (
            <p role="alert" className="text-sm text-err-text">
              {state.error}
            </p>
          ) : null}

          {state.query && state.results.length === 0 && !state.error ? (
            <p className="text-sm text-ink-2">No encontramos nada para “{state.query}”.</p>
          ) : null}

          {state.results.length > 0 ? (
            <div className="flex flex-col gap-2">
              {state.results.map((result) => {
                const ResultIcon = KIND_ICON[result.kind];
                return (
                  <div
                    key={`${result.kind}-${result.id}`}
                    className="rounded-2xl border border-line bg-surface p-3.5"
                  >
                    <p className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                      <ResultIcon className="h-4 w-4 shrink-0 text-ink-2" aria-hidden="true" />
                      {result.title}
                    </p>
                    <p className="text-[13px] text-ink-2">{result.subtitle}</p>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </Sheet>
    </>
  );
}
