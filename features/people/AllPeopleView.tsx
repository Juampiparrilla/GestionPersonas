"use client";

import { pluralize } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { GroupCard, GroupRow } from "@/components/ui/GroupCard";

import type { PersonLeaderGroup } from "./queries";
import { formatPhoneDisplay } from "@/utils/phone";

// Dirigente > sus punteros > las personas de cada puntero. Las personas se
// muestran bajo el nombre de su puntero.
export function AllPeopleView({ groups }: { groups: PersonLeaderGroup[] }) {
  if (groups.length === 0) {
    return (
      <EmptyState variant="blank" title="Todavía no hay dirigentes">
        Cargá un dirigente para empezar.
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-[9px]">
      {groups.map((group) => {
        const totalPeople = group.pointerGroups.reduce(
          (sum, pointerGroup) => sum + pointerGroup.people.length,
          0
        );
        return (
          <GroupCard
            key={group.leaderId}
            name={group.leaderName}
            summary={
              totalPeople === 0
                ? "sin personas"
                : `${pluralize(group.pointerGroups.length, "puntero", "punteros")} · ${pluralize(
                    totalPeople,
                    "persona",
                    "personas"
                  )}`
            }
            isEmpty={group.pointerGroups.length === 0}
            emptyMessage="Este dirigente todavía no tiene punteros."
          >
            {group.pointerGroups.map((pointerGroup) => (
              <div key={pointerGroup.pointerId} className="flex flex-col gap-1.5">
                <p className="text-[13px] font-semibold text-ink-label">
                  {pointerGroup.pointerName} · {pluralize(pointerGroup.people.length, "persona", "personas")}
                </p>
                {pointerGroup.people.length === 0 ? (
                  <p className="text-[13px] text-ink-2">
                    Este puntero todavía no tiene personas registradas.
                  </p>
                ) : (
                  pointerGroup.people.map((person) => (
                    <GroupRow
                      key={person.id}
                      title={person.fullName}
                      meta={`DNI ${person.dni}${person.phone ? ` · ${formatPhoneDisplay(person.phone)}` : ""}`}
                    />
                  ))
                )}
              </div>
            ))}
          </GroupCard>
        );
      })}
    </div>
  );
}
