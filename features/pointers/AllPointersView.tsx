"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

import type { PointerLeaderGroup } from "./queries";

function LeaderGroupCard({ group, index }: { group: PointerLeaderGroup; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between text-left"
      >
        <p className="font-medium text-zinc-900">
          {index + 1}. {group.leaderName}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-600">{group.pointers.length} punteros</span>
          {expanded ? (
            <ChevronUp className="h-5 w-5 shrink-0 text-zinc-400" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-5 w-5 shrink-0 text-zinc-400" aria-hidden="true" />
          )}
        </div>
      </button>

      {expanded ? (
        group.pointers.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">Este dirigente todavía no tiene punteros.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {group.pointers.map((pointer, index) => (
              <div key={pointer.id} className="rounded-lg border border-zinc-200 p-3">
                <p className="font-medium text-zinc-900">
                  {index + 1}. {pointer.fullName}
                </p>
                <p className="text-sm text-zinc-600">
                  DNI {pointer.dni} · {pointer.peopleCount} personas
                  {pointer.phone ? ` · ${pointer.phone}` : ""}
                </p>
              </div>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}

export function AllPointersView({ groups }: { groups: PointerLeaderGroup[] }) {
  if (groups.length === 0) {
    return (
      <p className="rounded-xl border border-zinc-200 bg-white p-4 text-center text-zinc-600">
        Todavía no hay dirigentes cargados.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group, index) => (
        <LeaderGroupCard key={group.leaderId} group={group} index={index} />
      ))}
    </div>
  );
}
