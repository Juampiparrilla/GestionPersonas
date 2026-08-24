"use client";

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
    setTimeout(() => setCopied(false), 2500);
  }

  if (accepted) {
    return (
      <span className="flex h-10 items-center gap-1 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-400">
        ✅ Ya inició sesión
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
        className="flex h-10 items-center gap-1 rounded-lg bg-green-600 px-3 text-sm font-medium text-white hover:bg-green-700"
      >
        📱 Enviar por WhatsApp
      </a>
    );
  }

  if (pending && !pending.whatsappLink) {
    return (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => handleCopy(pending.shareMessage)}
          className="flex h-10 items-center gap-1 rounded-lg bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800"
        >
          📋 {copied ? "¡Copiado!" : "Copiar mensaje de invitación"}
        </button>
        <p className="text-xs text-zinc-500">
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
        className="flex h-10 items-center gap-1 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Spinner className="h-4 w-4" /> Generando…
          </>
        ) : hasAccess ? (
          "🔄 Reenviar invitación"
        ) : (
          "📱 Invitar"
        )}
      </button>
      {error ? (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
