"use client";

import { useState } from "react";

import type { PersonLeaderGroup, PersonPointerGroup } from "./queries";

function PointerGroupCard({ group, index }: { group: PersonPointerGroup; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-zinc-200 p-3">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between text-left"
      >
        <p className="font-medium text-zinc-900">
          {index + 1}. {group.pointerName}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-600">{group.people.length} personas</span>
          <span className="text-zinc-400">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {expanded ? (
        group.people.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600">Este puntero todavía no tiene personas registradas.</p>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {group.people.map((person, personIndex) => (
              <div key={person.id} className="rounded-lg border border-zinc-100 bg-zinc-50 p-2">
                <p className="text-sm font-medium text-zinc-900">
                  {personIndex + 1}. {person.fullName}
                </p>
                <p className="text-xs text-zinc-600">
                  DNI {person.dni}
                  {person.phone ? ` · ${person.phone}` : ""}
                </p>
              </div>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}

function LeaderGroupCard({ group, index }: { group: PersonLeaderGroup; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const totalPeople = group.pointerGroups.reduce((sum, pointerGroup) => sum + pointerGroup.people.length, 0);

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
          <span className="text-sm text-zinc-600">
            {group.pointerGroups.length} punteros · {totalPeople} personas
          </span>
          <span className="text-lg text-zinc-400">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {expanded ? (
        group.pointerGroups.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">Este dirigente todavía no tiene punteros.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {group.pointerGroups.map((pointerGroup, pointerIndex) => (
              <PointerGroupCard key={pointerGroup.pointerId} group={pointerGroup} index={pointerIndex} />
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}

export function AllPeopleView({ groups }: { groups: PersonLeaderGroup[] }) {
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
