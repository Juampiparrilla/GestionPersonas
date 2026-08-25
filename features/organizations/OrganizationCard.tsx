"use client";

import { ChevronDown, ChevronUp, CircleCheck, CircleX } from "lucide-react";
import { useState, useTransition } from "react";

import { Spinner } from "@/components/Spinner";

import { setOrganizationActiveAction } from "./actions";
import { OrgAdminInviteButton } from "./OrgAdminInviteButton";
import type { OrganizationListItem } from "./queries";

export function OrganizationCard({ org, index }: { org: OrganizationListItem; index: number }) {
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
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex items-center justify-between text-left"
      >
        <div>
          <p className="font-bold text-zinc-900">
            {index + 1}. {org.name}
          </p>
          <p className="flex items-center gap-1.5 text-sm text-zinc-600">
            {org.isActive ? (
              <CircleCheck className="h-4 w-4 shrink-0 text-green-600" aria-hidden="true" />
            ) : (
              <CircleX className="h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
            )}
            {org.isActive ? "Activa" : "Desactivada"}
            {org.adminFullName ? ` · Admin: ${org.adminFullName}` : " · Sin administrador"}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-zinc-400" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-zinc-400" aria-hidden="true" />
        )}
      </button>

      {expanded ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
            <OrgAdminInviteButton
              organizationId={org.id}
              hasAdmin={Boolean(org.adminProfileId)}
              adminAccepted={org.adminAccepted}
            />
            <button
              type="button"
              onClick={toggleActive}
              disabled={isPending}
              className="flex h-10 items-center gap-1.5 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
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
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
