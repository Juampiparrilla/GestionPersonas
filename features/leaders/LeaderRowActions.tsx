"use client";

import { useState, useTransition } from "react";

import { Spinner } from "@/components/Spinner";
import type { LeaderAccessStatus } from "@/types/domain";

import { removeLeaderAction, setLeaderAccessStatusAction } from "./actions";
import { EditLeaderForm } from "./EditLeaderForm";
import { InviteButton } from "./InviteButton";

const STATUS_LABEL: Record<LeaderAccessStatus, string> = {
  active: "🟢 Activo",
  read_only: "⚪ Solo lectura",
  inactive: "🔴 Inactivo",
};

export function LeaderRowActions({
  leaderId,
  fullName,
  phone,
  address,
  accessStatus,
  pointerCount,
  hasAccess,
  accepted,
  isEditing,
  onStartEdit,
  onStopEdit,
}: {
  leaderId: string;
  fullName: string;
  phone: string | null;
  address: string | null;
  accessStatus: LeaderAccessStatus;
  pointerCount: number;
  hasAccess: boolean;
  accepted: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [isStatusPending, startStatusTransition] = useTransition();
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function changeStatus(status: LeaderAccessStatus) {
    setError(null);
    startStatusTransition(async () => {
      const result = await setLeaderAccessStatusAction(leaderId, status);
      if (result.error) setError(result.error);
    });
  }

  function confirmRemove() {
    setError(null);
    startTransition(async () => {
      const result = await removeLeaderAction(leaderId);
      if (result.error) {
        setError(result.error);
      } else {
        setConfirmingRemove(false);
      }
    });
  }

  if (isEditing) {
    return (
      <EditLeaderForm
        leaderId={leaderId}
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
        <div className="relative">
          <select
            value={accessStatus}
            disabled={isPending || isStatusPending}
            onChange={(event) => changeStatus(event.target.value as LeaderAccessStatus)}
            className="h-10 w-full rounded-lg border border-zinc-300 px-2 text-sm text-zinc-900 disabled:opacity-60"
          >
            <option value="active">{STATUS_LABEL.active}</option>
            <option value="read_only">{STATUS_LABEL.read_only}</option>
            <option value="inactive">{STATUS_LABEL.inactive}</option>
          </select>
          {isStatusPending ? (
            <span className="pointer-events-none absolute inset-y-0 right-8 flex items-center text-zinc-500">
              <Spinner className="h-4 w-4" />
            </span>
          ) : null}
        </div>

        {accessStatus !== "inactive" ? (
          <InviteButton leaderId={leaderId} hasAccess={hasAccess} accepted={accepted} />
        ) : null}

        <button
          type="button"
          onClick={onStartEdit}
          disabled={isPending || isStatusPending}
          className="h-10 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
        >
          ✏️ Editar
        </button>

        {!confirmingRemove ? (
          <button
            type="button"
            onClick={() => setConfirmingRemove(true)}
            disabled={isPending || isStatusPending}
            className="h-10 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
          >
            🗑️ Quitar
          </button>
        ) : null}
      </div>

      {confirmingRemove ? (
        <div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
          <p className="text-red-800">
            {pointerCount > 0
              ? `Este dirigente tiene ${pointerCount} punteros. Si lo quitás, dejará de aparecer y sus punteros van a quedar disponibles para ser registrados nuevamente.`
              : "¿Querés quitar a este dirigente?"}
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
