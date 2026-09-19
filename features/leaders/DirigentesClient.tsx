"use client";

import { useMemo, useState } from "react";

import { ActionBar } from "@/components/ui/ActionBar";
import { Chip, CountChip } from "@/components/ui/Chip";
import { CreateSheet } from "@/components/ui/CreateSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { EntityRow } from "@/components/ui/EntityRow";
import { Screen } from "@/components/ui/Screen";
import { SearchField } from "@/components/ui/SearchField";
import { normalizeDni } from "@/utils/dni";

import { CreateLeaderForm } from "./CreateLeaderForm";
import type { LeaderListItem } from "./queries";

const ACCESS_CHIP: Partial<Record<LeaderListItem["accessStatus"], string>> = {
  read_only: "solo lectura",
  inactive: "inactivo",
};

export function DirigentesClient({
  leaders,
  exportSlot,
}: {
  leaders: LeaderListItem[];
  exportSlot: React.ReactNode;
}) {
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const normalizedDniQuery = normalizeDni(query);

  const filteredLeaders = useMemo(() => {
    if (!normalizedQuery) return leaders;
    return leaders.filter((leader) => {
      const nameMatch = leader.fullName.toLowerCase().includes(normalizedQuery);
      const dniMatch = normalizedDniQuery.length > 0 && leader.dni.includes(normalizedDniQuery);
      return nameMatch || dniMatch;
    });
  }, [leaders, normalizedQuery, normalizedDniQuery]);

  return (
    <Screen
      title="Dirigentes"
      backHref="/superadmin"
      headerRight={<span className="font-mono text-[13px] font-medium text-ink-2">{leaders.length}</span>}
      headerExtra={
        leaders.length > 0 ? (
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Nombre o DNI"
            label="Buscar dirigentes"
          />
        ) : null
      }
      bar={
        <ActionBar>
          <div className="flex items-center gap-3">
            {exportSlot}
            <CreateSheet
              triggerLabel="Agregar dirigente"
              title="Agregar dirigente"
              successMessage="Dirigente creado. Para darle acceso, abrí su ficha y usá el botón de invitar."
              renderForm={(onCreated) => <CreateLeaderForm onCreated={onCreated} />}
            />
          </div>
        </ActionBar>
      }
    >
      {filteredLeaders.length === 0 ? (
        normalizedQuery ? (
          <EmptyState variant="search" title={`Sin resultados para “${query.trim()}”`}>
            No encontramos ningún dirigente con ese nombre o DNI.
          </EmptyState>
        ) : (
          <EmptyState variant="blank" title="Todavía no hay dirigentes">
            Empezá por cargar un dirigente; después vas a poder sumarle punteros, personas y
            vehículos.
          </EmptyState>
        )
      ) : (
        <div className="flex flex-col gap-[9px]">
          {filteredLeaders.map((leader) => (
            <EntityRow
              key={leader.id}
              href={`/superadmin/dirigentes/${leader.id}`}
              name={leader.fullName}
              meta={`DNI ${leader.dni}${leader.phone ? ` · ${leader.phone}` : ""}`}
              chips={
                <>
                  <CountChip count={leader.pointerCount} singular="puntero" plural="punteros" />
                  <CountChip count={leader.personCount} singular="persona" plural="personas" />
                  <CountChip count={leader.vehicleCount} singular="vehículo" plural="vehículos" />
                  {ACCESS_CHIP[leader.accessStatus] ? (
                    <Chip empty>{ACCESS_CHIP[leader.accessStatus]}</Chip>
                  ) : null}
                </>
              }
            />
          ))}
        </div>
      )}
    </Screen>
  );
}
