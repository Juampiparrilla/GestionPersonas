"use client";

import { CircleCheck, Copy, RefreshCw, Send } from "lucide-react";
import { useState, useTransition } from "react";

import { Spinner } from "@/components/Spinner";

import { resendInviteAction } from "./actions";

type Pending = { whatsappLink: string | null; shareMessage: string };

export function InviteButton({
  leaderId,
  hasAccess,
  accepted,
}: {
  leaderId: string;
  hasAccess: boolean;
  accepted: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [copied, setCopied] = useState(false);

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await resendInviteAction(leaderId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPending({ whatsappLink: result.whatsappLink, shareMessage: result.shareMessage });
    });
  }

  async function handleCopy(message: string) {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setPending(null);
    }, 1500);
  }

  if (accepted) {
    return (
      <span className="flex h-11 items-center gap-1.5 rounded-xl border border-line px-3.5 text-sm text-ink-ph">
        <CircleCheck className="h-4 w-4" aria-hidden="true" />
        Ya inició sesión
      </span>
    );
  }

  if (pending?.whatsappLink) {
    return (
      <a
        href={pending.whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => setPending(null)}
        className="flex h-11 items-center gap-1.5 rounded-xl bg-accent px-3.5 text-sm font-semibold text-white active:bg-accent-press"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
        Enviar por WhatsApp
      </a>
    );
  }

  if (pending && !pending.whatsappLink) {
    return (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => handleCopy(pending.shareMessage)}
          className="flex h-11 items-center gap-1.5 rounded-xl bg-accent px-3.5 text-sm font-semibold text-white active:bg-accent-press"
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
          {copied ? "¡Copiado!" : "Copiar mensaje de invitación"}
        </button>
        <p className="text-xs text-ink-2">
          No hay teléfono cargado, así que no se puede abrir WhatsApp directo. Copiá el mensaje y
          pegalo donde prefieras.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isPending}
        className="flex h-11 items-center gap-1.5 rounded-xl border border-line-input bg-surface px-3.5 text-sm font-semibold text-ink-label active:bg-muted disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Spinner className="h-4 w-4" /> Generando…
          </>
        ) : hasAccess ? (
          <>
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Reenviar invitación
          </>
        ) : (
          <>
            <Send className="h-4 w-4" aria-hidden="true" /> Invitar
          </>
        )}
      </button>
      {error ? (
        <p role="alert" className="text-xs text-err-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}
