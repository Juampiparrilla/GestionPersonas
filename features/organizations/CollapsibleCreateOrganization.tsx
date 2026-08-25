"use client";

import { Building2, CircleCheck, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { CreateOrganizationForm } from "./CreateOrganizationForm";

const SUCCESS_MESSAGE_MS = 4000;

export function CollapsibleCreateOrganization({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!showSuccess) return;
    const timeout = setTimeout(() => setShowSuccess(false), SUCCESS_MESSAGE_MS);
    return () => clearTimeout(timeout);
  }, [showSuccess]);

  const handleCreated = useCallback(() => {
    setShowSuccess(true);
    setFormKey((key) => key + 1);
    setOpen(false);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      {showSuccess ? (
        <p role="status" className="flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          <CircleCheck className="h-4 w-4 shrink-0 translate-y-0.5" aria-hidden="true" />
          La organización fue creada. La invitación para su administrador está lista más abajo,
          en su fila de la lista.
        </p>
      ) : null}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-12 items-center justify-center gap-2 rounded-lg bg-zinc-900 text-base font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          <Building2 className="h-5 w-5" aria-hidden="true" />
          Crear organización
        </button>
      ) : (
        <div className="flex flex-col gap-3 rounded-xl border-2 border-zinc-300 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-zinc-900">Crear organización</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <CreateOrganizationForm key={formKey} onCreated={handleCreated} />
        </div>
      )}
    </div>
  );
}
