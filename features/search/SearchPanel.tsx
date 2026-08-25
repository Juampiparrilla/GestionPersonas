"use client";

import { Car, ChevronDown, Search, UserRound, X } from "lucide-react";
import { useActionState, useState } from "react";

import { Spinner } from "@/components/Spinner";

import { searchDirectoryAction, type SearchResultKind, type SearchState } from "./actions";

const initialState: SearchState = { error: null, results: [], query: null };

const KIND_ICON: Record<SearchResultKind, typeof UserRound> = {
  leader: UserRound,
  pointer: UserRound,
  person: UserRound,
  vehicle: Car,
};

export function SearchPanel() {
  const [state, formAction, pending] = useActionState(searchDirectoryAction, initialState);
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 text-left"
      >
        <h2 className="flex items-center gap-2 font-medium text-zinc-900">
          <Search className="h-5 w-5 text-zinc-500" aria-hidden="true" />
          Buscar en toda la base
        </h2>
        <ChevronDown className="h-5 w-5 text-zinc-400" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border-2 border-zinc-300 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-medium text-zinc-900">
          <Search className="h-5 w-5 text-zinc-500" aria-hidden="true" />
          Buscar en toda la base
        </h2>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          aria-label="Cerrar"
          className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <p className="text-sm text-zinc-600">Ingresá un DNI, un nombre o una patente.</p>

      <form action={formAction} className="flex flex-col gap-2">
        <input
          type="text"
          name="query"
          placeholder="DNI, nombre o patente"
          maxLength={60}
          className="h-14 w-full rounded-lg border border-zinc-300 px-4 text-base text-zinc-900 focus:border-zinc-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex h-14 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-6 text-base font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-60"
        >
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
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}

      {state.query && state.results.length === 0 && !state.error ? (
        <p className="text-sm text-zinc-600">No encontramos nada para &quot;{state.query}&quot;.</p>
      ) : null}

      {state.results.length > 0 ? (
        <div className="flex flex-col gap-2">
          {state.results.map((result) => {
            const ResultIcon = KIND_ICON[result.kind];
            return (
              <div key={`${result.kind}-${result.id}`} className="rounded-lg border border-zinc-200 p-3">
                <p className="flex items-center gap-2 font-medium text-zinc-900">
                  <ResultIcon className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />
                  {result.title}
                </p>
                <p className="text-sm text-zinc-600">{result.subtitle}</p>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
