"use client";

import { useState } from "react";

import type { PersonPointerGroup } from "./queries";

function PointerGroupCard({ group }: { group: PersonPointerGroup }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between text-left"
      >
        <p className="font-medium text-zinc-900">
          Puntero: {group.pointerName}{" "}
          <span className="font-normal text-zinc-500">(Dirigente: {group.leaderName})</span>
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-600">{group.people.length} personas</span>
          <span className="text-lg text-zinc-400">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {expanded ? (
        group.people.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">Este puntero todavía no tiene personas registradas.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {group.people.map((person, index) => (
              <div key={person.id} className="rounded-lg border border-zinc-200 p-3">
                <p className="font-medium text-zinc-900">
                  {index + 1}. {person.fullName}
                </p>
                <p className="text-sm text-zinc-600">
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

export function AllPeopleView({ groups }: { groups: PersonPointerGroup[] }) {
  if (groups.length === 0) {
    return (
      <p className="rounded-xl border border-zinc-200 bg-white p-4 text-center text-zinc-600">
        Todavía no hay punteros cargados.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => (
        <PointerGroupCard key={group.pointerId} group={group} />
      ))}
    </div>
  );
}
