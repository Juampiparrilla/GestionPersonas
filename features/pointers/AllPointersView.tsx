"use client";

import { EmptyCell, MonoCell, NumCell, type Column } from "@/components/desktop/DataTable";
import { TablePage } from "@/components/desktop/TablePage";
import { pluralize } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { GroupCard, GroupRow } from "@/components/ui/GroupCard";
import { formatPhoneDisplay } from "@/utils/phone";

import type { PointerLeaderGroup } from "./queries";

type Row = {
  id: string;
  name: string;
  dni: string;
  phone: string | null;
  leaderName: string;
  peopleCount: number;
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
    key: "leader",
    header: "Dirigente",
    width: "1.8fr",
    render: (row) => <span className="truncate text-ink-label">{row.leaderName}</span>,
  },
  {
    key: "people",
    header: "Pers.",
    width: "0.7fr",
    align: "right",
    render: (row) => <NumCell value={row.peopleCount} />,
  },
];

export function AllPointersView({ groups }: { groups: PointerLeaderGroup[] }) {
  if (groups.length === 0) {
    return (
      <EmptyState variant="blank" title="Todavía no hay dirigentes">
        Cargá un dirigente para empezar.
      </EmptyState>
    );
  }

  const rows: Row[] = groups.flatMap((group) =>
    group.pointers.map((pointer) => ({
      id: pointer.id,
      name: pointer.fullName,
      dni: pointer.dni,
      phone: pointer.phone,
      leaderName: group.leaderName,
      peopleCount: pointer.peopleCount,
    }))
  );

  return (
    <>
      <div className="hidden lg:block">
        <TablePage
          title="Punteros"
          noun="puntero"
          rows={rows}
          columns={COLUMNS}
          getRowId={(row) => row.id}
          searchText={(row) => `${row.name} ${row.dni} ${row.leaderName}`}
          emptyMessage="Todavía no hay punteros cargados."
        />
      </div>

      <div className="flex flex-col gap-[9px] lg:hidden">
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
    </>
  );
}
