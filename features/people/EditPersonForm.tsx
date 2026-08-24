"use client";

import { useState, useTransition } from "react";

import { AddressField } from "@/components/fields/AddressField";
import { NameField } from "@/components/fields/NameField";
import { PhoneField } from "@/components/fields/PhoneField";

import { updatePersonAction } from "./actions";

export function EditPersonForm({
  personId,
  fullName,
  phone,
  address,
  onDone,
}: {
  personId: string;
  fullName: string;
  phone: string | null;
  address: string | null;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    const newFullName = String(formData.get("fullName") ?? "").trim();
    const newPhone = String(formData.get("phone") ?? "").trim();
    const newAddress = String(formData.get("address") ?? "").trim();

    if (!newFullName) {
      setError("El nombre no puede quedar vacío.");
      return;
    }

    startTransition(async () => {
      const result = await updatePersonAction(
        personId,
        newFullName,
        newPhone || null,
        newAddress || null
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      onDone();
    });
  }

  return (
    <form
      action={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor={`edit-person-name-${personId}`} className="text-sm font-medium text-zinc-700">
          Nombre completo
        </label>
        <NameField
          id={`edit-person-name-${personId}`}
          name="fullName"
          required
          defaultValue={fullName}
          className="h-11 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`edit-person-phone-${personId}`} className="text-sm font-medium text-zinc-700">
          Teléfono
        </label>
        <PhoneField
          id={`edit-person-phone-${personId}`}
          name="phone"
          defaultValue={phone ?? ""}
          className="h-11 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`edit-person-address-${personId}`} className="text-sm font-medium text-zinc-700">
          Dirección
        </label>
        <AddressField
          id={`edit-person-address-${personId}`}
          name="address"
          defaultValue={address ?? ""}
          className="h-11 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-900"
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDone}
          className="h-10 flex-1 rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="h-10 flex-1 rounded-lg bg-zinc-900 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isPending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
