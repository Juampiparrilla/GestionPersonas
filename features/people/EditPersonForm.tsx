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
      className="flex flex-col gap-3.5"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor={`edit-person-name-${personId}`} className="text-[13px] font-semibold text-ink-label">
          Nombre completo
        </label>
        <NameField
          id={`edit-person-name-${personId}`}
          name="fullName"
          required
          defaultValue={fullName}
          className="h-12 w-full rounded-[14px] border border-line-input bg-surface px-3.5 text-base text-ink focus:border-[1.5px] focus:border-ink focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`edit-person-phone-${personId}`} className="text-[13px] font-semibold text-ink-label">
          Teléfono
        </label>
        <PhoneField
          id={`edit-person-phone-${personId}`}
          name="phone"
          defaultValue={phone ?? ""}
          className="h-12 w-full rounded-[14px] border border-line-input bg-surface px-3.5 text-base text-ink focus:border-[1.5px] focus:border-ink focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`edit-person-address-${personId}`} className="text-[13px] font-semibold text-ink-label">
          Dirección
        </label>
        <AddressField
          id={`edit-person-address-${personId}`}
          name="address"
          defaultValue={address ?? ""}
          className="h-12 w-full rounded-[14px] border border-line-input bg-surface px-3.5 text-base text-ink focus:border-[1.5px] focus:border-ink focus:outline-none"
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-err-text">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDone}
          className="h-12 flex-1 rounded-[14px] border border-line-input bg-surface text-sm font-semibold text-ink-label active:bg-muted"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="h-12 flex-1 rounded-[14px] bg-accent text-sm font-semibold text-white active:bg-accent-press disabled:bg-disabled-bg disabled:text-disabled-ink"
        >
          {isPending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
