"use client";

import { MoreHorizontal, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyCell, MonoCell, NumCell, type Column } from "@/components/desktop/DataTable";
import { useShellUrl } from "@/components/desktop/ShellContext";
import { TableWithPanel } from "@/components/desktop/TableWithPanel";
import { Spinner } from "@/components/Spinner";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { btnIcon, cardClass } from "@/components/ui/styles";
import { PeopleList } from "@/features/people/PeopleList";
import type { PersonListItem } from "@/features/people/queries";
import { formatPhoneDisplay } from "@/utils/phone";

import { loadPointerPeopleAction } from "./deskActions";
import { PointerRowActions } from "./PointerRowActions";
import type { PointerListItem } from "./queries";

const COLUMNS: Column<PointerListItem>[] = [
  {
    key: "name",
    header: "Nombre",
    width: "2.2fr",
    render: (pointer) => (
      <span className="flex min-w-0 items-center gap-3">
        <Avatar name={pointer.fullName} size="sm" />
        <span className="truncate font-semibold text-ink">{pointer.fullName}</span>
      </span>
    ),
  },
  { key: "dni", header: "DNI", width: "1.2fr", render: (pointer) => <MonoCell>{pointer.dni}</MonoCell> },
  {
    key: "phone",
    header: "Teléfono",
    width: "1.3fr",
    render: (pointer) =>
      pointer.phone ? <MonoCell>{formatPhoneDisplay(pointer.phone)}</MonoCell> : <EmptyCell />,
  },
  {
    key: "people",
    header: "Personas",
    width: "0.9fr",
    align: "right",
    render: (pointer) => <NumCell value={pointer.peopleCount} />,
  },
];

// Panel de un puntero: sus datos, editar / quitar y las personas que registro.
function PointerPanel({
  pointer,
  canWrite,
  onClose,
}: {
  pointer: PointerListItem;
  canWrite: boolean;
  onClose: () => void;
}) {
  const { openCarga } = useShellUrl();
  const [mode, setMode] = useState<"edit" | "actions" | null>(null);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<{
    key: string;
    people: PersonListItem[] | null;
  } | null>(null);

  // Se vuelve a pedir la lista cuando cambia la cantidad (alta / baja de una
  // persona): la pagina ya se refresco con los datos nuevos.
  const key = `${pointer.id}:${pointer.peopleCount}`;
  useEffect(() => {
    let cancelled = false;
    loadPointerPeopleAction(pointer.id).then((people) => {
      if (!cancelled) setLoaded({ key, people });
    });
    return () => {
      cancelled = true;
    };
  }, [pointer.id, key]);

  const loading = !loaded || loaded.key !== key;
  const people = loaded && loaded.key === key ? loaded.people : null;

  return (
    <>
      <div className="flex flex-col gap-3.5 border-b border-line p-5">
        <div className="flex items-start gap-3">
          <Avatar name={pointer.fullName} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-ink-3">
              Puntero
            </p>
            <h2 className="text-[19px] font-semibold leading-tight tracking-[-0.015em] text-ink">
              {pointer.fullName}
            </h2>
            <p className="mt-0.5 font-mono text-[13px] font-medium text-ink-2">
              {pointer.dni}
              {pointer.phone ? ` · ${formatPhoneDisplay(pointer.phone)}` : ""}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar detalle" className={btnIcon}>
            <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
        {canWrite ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openCarga("person", undefined, pointer.id)}
              className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-accent-press"
            >
              <UserRound className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              Agregar persona
            </button>
            <button
              type="button"
              onClick={() => setMode(mode === "edit" ? null : "edit")}
              aria-expanded={mode === "edit"}
              className="flex h-10 items-center rounded-xl border border-line-input bg-surface px-3.5 text-sm font-semibold text-ink-label hover:bg-muted"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => setMode(mode === "actions" ? null : "actions")}
              aria-label="Más acciones"
              aria-expanded={mode === "actions"}
              className={`${btnIcon} !h-10 !w-10`}
            >
              <MoreHorizontal className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 p-5">
        {mode ? (
          <section className={`${cardClass} p-3.5`}>
            <PointerRowActions
              pointerId={pointer.id}
              fullName={pointer.fullName}
              phone={pointer.phone}
              address={pointer.address}
              peopleCount={pointer.peopleCount}
              canWrite={canWrite}
              isEditing={mode === "edit"}
              onStartEdit={() => setMode("edit")}
              onStopEdit={() => setMode(null)}
              onRemoved={onClose}
            />
          </section>
        ) : null}

        <p className="font-mono text-[12px] font-medium uppercase tracking-[0.1em] text-ink-3">
          Personas · {pointer.peopleCount}
        </p>

        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner className="h-7 w-7 text-accent" />
          </div>
        ) : people ? (
          <PeopleList
            people={people}
            pointerId={pointer.id}
            empty={
              <EmptyState variant="blank" title="Todavía no hay personas">
                Agregá la primera con “Agregar persona”.
              </EmptyState>
            }
            canWrite={canWrite}
            editingId={editingPersonId}
            onStartEdit={setEditingPersonId}
            onStopEdit={() => setEditingPersonId(null)}
          />
        ) : (
          <p className="text-sm text-ink-2">No pudimos cargar las personas de este puntero.</p>
        )}
      </div>
    </>
  );
}

// Punteros en escritorio: tabla + panel con el detalle a la derecha.
export function PointersDesktop({
  pointers,
  canWrite,
}: {
  pointers: PointerListItem[];
  canWrite: boolean;
}) {
  return (
    <TableWithPanel
      title="Punteros"
      noun="puntero"
      rows={pointers}
      columns={COLUMNS}
      getRowId={(pointer) => pointer.id}
      searchText={(pointer) => `${pointer.fullName} ${pointer.dni}`}
      emptyMessage="Todavía no hay punteros. Cargá el primero con “Agregar puntero”."
      renderPanel={(pointer, close) => (
        <PointerPanel key={pointer.id} pointer={pointer} canWrite={canWrite} onClose={close} />
      )}
    />
  );
}
