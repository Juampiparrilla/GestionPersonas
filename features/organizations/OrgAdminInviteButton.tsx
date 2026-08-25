"use client";

import { CircleCheck, Copy, RefreshCw, Send, UserRoundPlus } from "lucide-react";
import { useState, useTransition } from "react";

import { Spinner } from "@/components/Spinner";

import { grantOrCreateOrgAdminAction } from "./actions";

type Pending = { whatsappLink: string | null; shareMessage: string };

const inputClassName =
  "h-10 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none";

export function OrgAdminInviteButton({
  organizationId,
  hasAdmin,
  adminAccepted,
}: {
  organizationId: string;
  hasAdmin: boolean;
  adminAccepted: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [copied, setCopied] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await grantOrCreateOrgAdminAction(organizationId, fullName, dni, email, phone || null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setShowCreateForm(false);
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

  if (adminAccepted) {
    return (
      <span className="flex h-10 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-400">
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
        className="flex h-10 items-center gap-1.5 rounded-lg bg-green-600 px-3 text-sm font-medium text-white hover:bg-green-700"
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
          className="flex h-10 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
          {copied ? "¡Copiado!" : "Copiar mensaje de invitación"}
        </button>
        <p className="text-xs text-zinc-500">
          No hay teléfono cargado, así que no se puede abrir WhatsApp directo. Copiá el mensaje y
          pegalo donde prefieras.
        </p>
      </div>
    );
  }

  if (!hasAdmin && showCreateForm) {
    return (
      <div className="flex w-full flex-col gap-2 rounded-lg border border-zinc-200 p-3">
        <input
          type="text"
          placeholder="Nombre completo del administrador"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className={inputClassName}
        />
        <input
          type="text"
          inputMode="numeric"
          placeholder="DNI"
          value={dni}
          onChange={(event) => setDni(event.target.value)}
          className={inputClassName}
        />
        <input
          type="email"
          placeholder="Correo (opcional)"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClassName}
        />
        <input
          type="tel"
          placeholder="Teléfono (opcional)"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className={inputClassName}
        />
        {error ? (
          <p role="alert" className="text-xs text-red-600">
            {error}
          </p>
        ) : null}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowCreateForm(false)}
            disabled={isPending}
            className="h-9 flex-1 rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isPending}
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-zinc-900 text-sm font-medium text-white disabled:opacity-60"
          >
            {isPending ? <Spinner className="h-4 w-4" /> : <UserRoundPlus className="h-4 w-4" aria-hidden="true" />}
            Crear
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => (hasAdmin ? handleGenerate() : setShowCreateForm(true))}
        disabled={isPending}
        className="flex h-10 items-center gap-1.5 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Spinner className="h-4 w-4" /> Generando…
          </>
        ) : hasAdmin ? (
          <>
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Reenviar invitación
          </>
        ) : (
          <>
            <UserRoundPlus className="h-4 w-4" aria-hidden="true" /> Crear administrador
          </>
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
