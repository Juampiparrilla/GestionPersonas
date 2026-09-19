"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { Spinner } from "@/components/Spinner";

import { removePointerAction } from "./actions";
import { EditPointerForm } from "./EditPointerForm";

export function PointerRowActions({
  pointerId,
  fullName,
  phone,
  address,
  peopleCount,
  canWrite,
  isEditing,
  onStartEdit,
  onStopEdit,
  onRemoved,
}: {
  pointerId: string;
  fullName: string;
  phone: string | null;
  address: string | null;
  peopleCount: number;
  canWrite: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
  // Se llama despues de quitar al puntero (la ficha vuelve a la lista).
  onRemoved?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function confirmRemove() {
    setError(null);
    startTransition(async () => {
      const result = await removePointerAction(pointerId);
      if (result.error) {
        setError(result.error);
      } else {
        setConfirmingRemove(false);
        onRemoved?.();
      }
    });
  }

  if (isEditing) {
    return (
      <EditPointerForm
        pointerId={pointerId}
        fullName={fullName}
        phone={phone}
        address={address}
        onDone={onStopEdit}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {canWrite ? (
          <button
            type="button"
            onClick={onStartEdit}
            disabled={isPending}
            className="flex h-11 min-w-fit whitespace-nowrap flex-1 items-center justify-center gap-1.5 rounded-xl border border-line-input bg-surface px-2 text-sm font-semibold text-ink-label active:bg-muted disabled:opacity-60"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Editar
          </button>
        ) : null}

        {canWrite && !confirmingRemove ? (
          <button
            type="button"
            onClick={() => setConfirmingRemove(true)}
            disabled={isPending}
            className="flex h-11 min-w-fit whitespace-nowrap flex-1 items-center justify-center gap-1.5 rounded-xl border border-line-input bg-surface px-2 text-sm font-semibold text-ink-label active:bg-muted disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Quitar
          </button>
        ) : null}
      </div>

      {confirmingRemove ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-err-border bg-err-bg p-3.5 text-sm">
          <p className="text-err-ink">
            {peopleCount > 0
              ? `Este puntero tiene ${peopleCount} personas registradas. Si lo quitás, dejará de aparecer y esas personas van a quedar disponibles para ser registradas nuevamente.`
              : "¿Querés quitar a este puntero?"}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmingRemove(false)}
              disabled={isPending}
              className="h-11 flex-1 rounded-xl border border-line-input bg-surface text-sm font-semibold text-ink-label disabled:opacity-60"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={confirmRemove}
              disabled={isPending}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-err-line text-sm font-semibold text-white disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <Spinner className="h-4 w-4" /> Quitando…
                </>
              ) : (
                "Sí, quitar"
              )}
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-err-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}
