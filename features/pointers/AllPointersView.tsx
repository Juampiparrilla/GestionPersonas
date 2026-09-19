"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { GroupCard, GroupRow } from "@/components/ui/GroupCard";
import { pluralize } from "@/components/ui/Chip";

import type { PointerLeaderGroup } from "./queries";
import { formatPhoneDisplay } from "@/utils/phone";

export function AllPointersView({ groups }: { groups: PointerLeaderGroup[] }) {
  if (groups.length === 0) {
    return (
      <EmptyState variant="blank" title="Todavía no hay dirigentes">
        Cargá un dirigente para empezar.
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-[9px]">
      {groups.map((group) => (
        <GroupCard
          key={group.leaderId}
          name={group.leaderName}
          summary={
            group.pointers.length === 0
              ? "sin punteros"
              : pluralize(group.pointers.length, "puntero", "punteros")
          }
          isEmpty={group.pointers.length === 0}
          emptyMessage="Este dirigente todavía no tiene punteros."
        >
          {group.pointers.map((pointer) => (
            <GroupRow
              key={pointer.id}
              title={pointer.fullName}
              meta={`DNI ${pointer.dni}${pointer.phone ? ` · ${formatPhoneDisplay(pointer.phone)}` : ""} · ${pluralize(
                pointer.peopleCount,
                "persona",
                "personas"
              )}`}
            />
          ))}
        </GroupCard>
      ))}
    </div>
  );
}
