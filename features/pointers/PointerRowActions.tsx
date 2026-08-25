"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
        <Link
          href={`/dirigente/punteros/${pointerId}`}
          className="flex h-10 items-center gap-1 rounded-lg bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800"
        >
          +👤 Ver personas
        </Link>

        {canWrite ? (
          <button
            type="button"
            onClick={onStartEdit}
            disabled={isPending}
            className="h-10 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
          >
            ✏️ Editar
          </button>
        ) : null}

        {canWrite && !confirmingRemove ? (
          <button
            type="button"
            onClick={() => setConfirmingRemove(true)}
            disabled={isPending}
            className="h-10 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
          >
            🗑️ Quitar
          </button>
        ) : null}
      </div>

      {confirmingRemove ? (
        <div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
          <p className="text-red-800">
            {peopleCount > 0
              ? `Este puntero tiene ${peopleCount} personas registradas. Si lo quitás, dejará de aparecer y esas personas van a quedar disponibles para ser registradas nuevamente.`
              : "¿Querés quitar a este puntero?"}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmingRemove(false)}
              disabled={isPending}
              className="h-9 flex-1 rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700 disabled:opacity-60"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={confirmRemove}
              disabled={isPending}
              className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 text-sm font-medium text-white disabled:opacity-60"
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
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
