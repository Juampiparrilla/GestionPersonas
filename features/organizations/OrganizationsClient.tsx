"use client";

import { useMemo, useState } from "react";

import { RoleHelpButton } from "@/components/RoleHelpButton";
import { CreateSheet } from "@/components/ui/CreateSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { PlatformBottomNav } from "@/components/ui/RoleNav";
import { Screen } from "@/components/ui/Screen";
import { SearchField } from "@/components/ui/SearchField";

import { CreateOrganizationForm } from "./CreateOrganizationForm";
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
    <Screen
      title="Organizaciones"
      headerRight={
        <div className="flex items-center gap-2">
          <span className="mr-1 font-mono text-[13px] font-medium text-ink-2">
            {organizations.length}
          </span>
          <RoleHelpButton role="platform_admin" />
          <CreateSheet
            variant="header"
            triggerLabel="Crear organización"
            title="Crear organización"
            successMessage="La organización fue creada. La invitación de su administrador está en su fila de la lista."
            renderForm={(onCreated) => <CreateOrganizationForm onCreated={onCreated} />}
          />
        </div>
      }
      headerExtra={
        organizations.length > 0 ? (
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Buscar organización"
            label="Buscar organizaciones"
          />
        ) : null
      }
      bar={<PlatformBottomNav />}
    >
      {filtered.length === 0 ? (
        normalizedQuery ? (
          <EmptyState variant="search" title={`Sin resultados para “${query.trim()}”`}>
            No encontramos ninguna organización con ese nombre.
          </EmptyState>
        ) : (
          <EmptyState variant="blank" title="Todavía no hay organizaciones">
            Creá la primera con el botón + de arriba.
          </EmptyState>
        )
      ) : (
        <div className="flex flex-col gap-[9px]">
          {filtered.map((org) => (
            <OrganizationCard key={org.id} org={org} />
          ))}
        </div>
      )}
    </Screen>
  );
}
