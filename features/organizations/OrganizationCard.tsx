"use client";

import { CircleCheck, CircleX } from "lucide-react";
import { useState, useTransition } from "react";

import { Spinner } from "@/components/Spinner";
import { Chip } from "@/components/ui/Chip";
import { EntityRow } from "@/components/ui/EntityRow";

import { setOrganizationActiveAction } from "./actions";
import { OrgAdminInviteButton } from "./OrgAdminInviteButton";
import type { OrganizationListItem } from "./queries";

export function OrganizationCard({ org }: { org: OrganizationListItem }) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleActive() {
    setError(null);
    startTransition(async () => {
      const result = await setOrganizationActiveAction(org.id, !org.isActive);
      if (result.error) setError(result.error);
    });
  }

  return (
    <EntityRow
      name={org.name}
      meta={org.adminFullName ? `Admin: ${org.adminFullName}` : undefined}
      chips={
        <>
          <Chip empty={!org.isActive}>{org.isActive ? "Activa" : "Desactivada"}</Chip>
          {!org.adminFullName ? <Chip empty>sin administrador</Chip> : null}
        </>
      }
      expanded={expanded}
      onToggle={() => setExpanded((value) => !value)}
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <OrgAdminInviteButton
            organizationId={org.id}
            hasAdmin={Boolean(org.adminProfileId)}
            adminAccepted={org.adminAccepted}
          />
          <button
            type="button"
            onClick={toggleActive}
            disabled={isPending}
            className="flex h-11 items-center gap-1.5 rounded-xl border border-line-input bg-surface px-3.5 text-sm font-semibold text-ink-label active:bg-muted disabled:opacity-60"
          >
            {isPending ? (
              <Spinner className="h-4 w-4" />
            ) : org.isActive ? (
              <CircleX className="h-4 w-4" aria-hidden="true" />
            ) : (
              <CircleCheck className="h-4 w-4" aria-hidden="true" />
            )}
            {org.isActive ? "Desactivar" : "Activar"}
          </button>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-err-text">
            {error}
          </p>
        ) : null}
      </div>
    </EntityRow>
  );
}
