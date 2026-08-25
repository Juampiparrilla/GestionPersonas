"use client";

import { useActionState, useState } from "react";

import { Spinner } from "@/components/Spinner";

import { searchDirectoryAction, type SearchResultKind, type SearchState } from "./actions";

const initialState: SearchState = { error: null, results: [], query: null };

const KIND_ICON: Record<SearchResultKind, string> = {
  leader: "🧑‍💼",
  pointer: "👤",
  person: "🙋",
  vehicle: "🚗",
};

export function SearchPanel() {
  const [state, formAction, pending] = useActionState(searchDirectoryAction, initialState);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between text-left"
      >
        <h2 className="font-medium text-zinc-900">🔎 Buscar en toda la base</h2>
        <span className="text-lg text-zinc-400">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded ? (
        <>
          <p className="text-sm text-zinc-600">Ingresá un DNI, un nombre o una patente.</p>

          <form action={formAction} className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              name="query"
              placeholder="DNI, nombre o patente"
              className="h-12 flex-1 rounded-lg border border-zinc-300 px-4 text-base text-zinc-900 focus:border-zinc-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={pending}
              className="flex h-12 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-6 text-base font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-60"
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
              {state.results.map((result) => (
                <div key={`${result.kind}-${result.id}`} className="rounded-lg border border-zinc-200 p-3">
                  <p className="font-medium text-zinc-900">
                    {KIND_ICON[result.kind]} {result.title}
                  </p>
                  <p className="text-sm text-zinc-600">{result.subtitle}</p>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
