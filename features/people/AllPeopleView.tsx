"use client";

import { EmptyCell, MonoCell, type Column } from "@/components/desktop/DataTable";
import { TablePage } from "@/components/desktop/TablePage";
import { pluralize } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { GroupCard, GroupRow } from "@/components/ui/GroupCard";
import { formatPhoneDisplay } from "@/utils/phone";

import type { PersonLeaderGroup } from "./queries";

type Row = {
  id: string;
  name: string;
  dni: string;
  phone: string | null;
  pointerName: string;
  leaderName: string;
};

const COLUMNS: Column<Row>[] = [
  {
    key: "name",
    header: "Nombre",
    width: "2fr",
    render: (row) => <span className="truncate font-semibold text-ink">{row.name}</span>,
  },
  { key: "dni", header: "DNI", width: "1.1fr", render: (row) => <MonoCell>{row.dni}</MonoCell> },
  {
    key: "phone",
    header: "Teléfono",
    width: "1.2fr",
    render: (row) => (row.phone ? <MonoCell>{formatPhoneDisplay(row.phone)}</MonoCell> : <EmptyCell />),
  },
  {
    key: "pointer",
    header: "Puntero",
    width: "1.6fr",
    render: (row) => <span className="truncate text-ink-label">{row.pointerName}</span>,
  },
  {
    key: "leader",
    header: "Dirigente",
    width: "1.6fr",
    render: (row) => <span className="truncate text-ink-label">{row.leaderName}</span>,
  },
];

// Dirigente > sus punteros > las personas de cada puntero. Las personas se
// muestran bajo el nombre de su puntero (movil); en escritorio es una tabla.
export function AllPeopleView({ groups }: { groups: PersonLeaderGroup[] }) {
  if (groups.length === 0) {
    return (
      <EmptyState variant="blank" title="Todavía no hay dirigentes">
        Cargá un dirigente para empezar.
      </EmptyState>
    );
  }

  const rows: Row[] = groups.flatMap((group) =>
    group.pointerGroups.flatMap((pointerGroup) =>
      pointerGroup.people.map((person) => ({
        id: person.id,
        name: person.fullName,
        dni: person.dni,
        phone: person.phone,
        pointerName: pointerGroup.pointerName,
        leaderName: group.leaderName,
      }))
    )
  );

  return (
    <>
      <div className="hidden lg:block">
        <TablePage
          title="Personas"
          noun="persona"
          rows={rows}
          columns={COLUMNS}
          getRowId={(row) => row.id}
          searchText={(row) => `${row.name} ${row.dni} ${row.pointerName} ${row.leaderName}`}
          emptyMessage="Todavía no hay personas registradas."
        />
      </div>

      <div className="flex flex-col gap-[9px] lg:hidden">
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
    </>
  );
}
