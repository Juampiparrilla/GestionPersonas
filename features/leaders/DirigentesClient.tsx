"use client";

import { useMemo, useState } from "react";

import { normalizeDni } from "@/utils/dni";

import { CollapsibleCreateLeader } from "./CollapsibleCreateLeader";
import { LeadersList } from "./LeadersList";
import type { LeaderListItem } from "./queries";

export function DirigentesClient({ leaders }: { leaders: LeaderListItem[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const normalizedDniQuery = normalizeDni(query);

  const filteredLeaders = useMemo(() => {
    if (!normalizedQuery) return leaders;
    return leaders.filter((leader) => {
      const nameMatch = leader.fullName.toLowerCase().includes(normalizedQuery);
      const dniMatch = normalizedDniQuery.length > 0 && leader.dni.includes(normalizedDniQuery);
      return nameMatch || dniMatch;
    });
  }, [leaders, normalizedQuery, normalizedDniQuery]);

  return (
    <div className="flex flex-col gap-4">
      <CollapsibleCreateLeader onOpenChange={setFormOpen} />

      {!formOpen ? (
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400">
            🔎
          </span>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre o DNI"
            className="h-12 w-full rounded-lg border border-zinc-300 pl-10 pr-4 text-base text-zinc-900 focus:border-zinc-500 focus:outline-none"
          />
        </div>
      ) : null}

      <LeadersList
        leaders={formOpen ? leaders : filteredLeaders}
        emptyMessage={
          normalizedQuery
            ? "No encontramos ningún dirigente con ese nombre o DNI."
            : "Todavía no hay dirigentes cargados."
        }
      />
    </div>
  );
}
