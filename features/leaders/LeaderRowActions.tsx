"use client";

import { CircleCheck, CircleX, Eye, Pencil, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { Spinner } from "@/components/Spinner";
import type { LeaderAccessStatus } from "@/types/domain";

import { removeLeaderAction, setLeaderAccessStatusAction } from "./actions";
import { EditLeaderForm } from "./EditLeaderForm";
import { InviteButton } from "./InviteButton";

const STATUS_LABEL: Record<LeaderAccessStatus, string> = {
  active: "Activo",
  read_only: "Solo lectura",
  inactive: "Inactivo",
};

const STATUS_ICON: Record<LeaderAccessStatus, typeof CircleCheck> = {
  active: CircleCheck,
  read_only: Eye,
  inactive: CircleX,
};

const STATUS_ICON_COLOR: Record<LeaderAccessStatus, string> = {
  active: "text-green-600",
  read_only: "text-ink-ph",
  inactive: "text-err-text",
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
  onRemoved,
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
  // Se llama despues de quitar al dirigente (la ficha de detalle vuelve a la lista).
  onRemoved?: () => void;
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
        onRemoved?.();
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
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          {(() => {
            const StatusIcon = STATUS_ICON[accessStatus];
            return (
              <StatusIcon
                className={`pointer-events-none absolute inset-y-0 left-2 my-auto h-4 w-4 ${STATUS_ICON_COLOR[accessStatus]}`}
                aria-hidden="true"
              />
            );
          })()}
          <select
            value={accessStatus}
            disabled={isPending || isStatusPending}
            onChange={(event) => changeStatus(event.target.value as LeaderAccessStatus)}
            className="h-11 w-full rounded-xl border border-line-input bg-surface py-2 pl-8 pr-2 text-sm text-ink disabled:opacity-60"
          >
            <option value="active">{STATUS_LABEL.active}</option>
            <option value="read_only">{STATUS_LABEL.read_only}</option>
            <option value="inactive">{STATUS_LABEL.inactive}</option>
          </select>
          {isStatusPending ? (
            <span className="pointer-events-none absolute inset-y-0 right-8 flex items-center text-ink-2">
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
          className="flex h-11 items-center gap-1.5 rounded-xl border border-line-input bg-surface px-3.5 text-sm font-semibold text-ink-label active:bg-muted disabled:opacity-60"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Editar
        </button>

        {!confirmingRemove ? (
          <button
            type="button"
            onClick={() => setConfirmingRemove(true)}
            disabled={isPending || isStatusPending}
            className="flex h-11 items-center gap-1.5 rounded-xl border border-line-input bg-surface px-3.5 text-sm font-semibold text-ink-label active:bg-muted disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Quitar
          </button>
        ) : null}
      </div>

      {confirmingRemove ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-err-border bg-err-bg p-3.5 text-sm">
          <p className="text-err-ink">
            {pointerCount > 0
              ? `Este dirigente tiene ${pointerCount} punteros. Si lo quitás, dejará de aparecer y sus punteros van a quedar disponibles para ser registrados nuevamente.`
              : "¿Querés quitar a este dirigente?"}
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
