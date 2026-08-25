"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { CollapsibleCreateOrganization } from "./CollapsibleCreateOrganization";
import { OrganizationCard } from "./OrganizationCard";
import type { OrganizationListItem } from "./queries";

export function OrganizationsClient({ organizations }: { organizations: OrganizationListItem[] }) {
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!normalizedQuery) return organizations;
    return organizations.filter((org) => org.name.toLowerCase().includes(normalizedQuery));
  }, [organizations, normalizedQuery]);

  return (
    <div className="flex flex-col gap-4">
      <CollapsibleCreateOrganization />

      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400">
          <Search className="h-4 w-4" aria-hidden="true" />
        </span>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar organización por nombre"
          className="h-12 w-full rounded-lg border border-zinc-300 pl-10 pr-4 text-base text-zinc-900 focus:border-zinc-500 focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg bg-zinc-100 p-4 text-sm text-zinc-600">
          {normalizedQuery
            ? "No encontramos ninguna organización con ese nombre."
            : "Todavía no hay organizaciones creadas."}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((org, index) => (
            <OrganizationCard key={org.id} org={org} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
