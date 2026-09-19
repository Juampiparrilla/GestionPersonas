"use client";

import { useEffect, useState } from "react";

import { AddressField } from "@/components/fields/AddressField";
import { DniField } from "@/components/fields/DniField";
import { NameField } from "@/components/fields/NameField";
import { PhoneField } from "@/components/fields/PhoneField";
import { ExistingRecordCard, Field } from "@/components/ui/FormParts";
import { inputClass, inputMonoClass } from "@/components/ui/styles";
import { useFormFields } from "@/components/ui/useFormFields";
import { isValidDniFormat, normalizeDni } from "@/utils/dni";
import type { FieldErrors } from "@/utils/form-errors";
import { validateDni, validateFullName, validatePhone } from "@/utils/validation";

import { lookupDniAction, type DniMatch } from "./actions";

type PersonFieldName = "fullName" | "dni" | "phone" | "address";

const FIELD_ORDER: PersonFieldName[] = ["fullName", "dni", "phone", "address"];
const LOOKUP_DEBOUNCE_MS = 400;

type FoundMatch = Extract<DniMatch, { found: true }>;

// Estado y validacion de los campos de una persona (dirigente / puntero /
// persona): nombre, DNI, telefono y direccion. Ademas de la validacion por
// campo (ver useFormFields), el DNI se consulta contra la base -- con 400ms
// de espera -- para avisar "Ya existe" antes de guardar.
export function usePersonFields(serverErrors: FieldErrors | undefined) {
  const form = useFormFields<PersonFieldName>({
    initial: { fullName: "", dni: "", phone: "", address: "" },
    validators: { fullName: validateFullName, dni: validateDni, phone: validatePhone },
    serverErrors,
    order: FIELD_ORDER,
  });

  const [lookup, setLookup] = useState<{ dni: string; match: DniMatch } | null>(null);
  const dniDigits = normalizeDni(form.values.dni);

  useEffect(() => {
    if (!isValidDniFormat(dniDigits)) return;
    let cancelled = false;
    const timeout = setTimeout(async () => {
      const match = await lookupDniAction(dniDigits);
      if (!cancelled) setLookup({ dni: dniDigits, match });
    }, LOOKUP_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [dniDigits]);

  // Solo vale la consulta que corresponde al DNI que esta escrito ahora.
  const duplicate: FoundMatch | null =
    lookup && lookup.dni === dniDigits && lookup.match.found ? lookup.match : null;

  return {
    ...form,
    duplicate,
    // El DNI duplicado lo explica la tarjeta "Ya existe", no un texto de error.
    error: (field: PersonFieldName) =>
      field === "dni" && duplicate && !form.error("dni") ? null : form.error(field),
    invalid: (field: PersonFieldName) =>
      Boolean(form.error(field)) || (field === "dni" && duplicate !== null),
    canSubmit: form.canSubmit && duplicate === null,
  };
}

export type PersonFieldsState = ReturnType<typeof usePersonFields>;

export function PersonFields({ f }: { f: PersonFieldsState }) {
  return (
    <>
      <Field
        id="fullName"
        label="Nombre completo"
        required
        hint="Apellido primero, después el nombre."
        error={f.error("fullName")}
      >
        <NameField
          id="fullName"
          name="fullName"
          required
          className={inputClass}
          value={f.values.fullName}
          onValueChange={(value) => f.setValue("fullName", value)}
          onBlur={() => f.blur("fullName")}
          invalid={f.invalid("fullName")}
          describedBy={f.error("fullName") ? "fullName-error" : undefined}
        />
      </Field>

      <Field
        id="dni"
        label="DNI"
        required
        error={f.error("dni")}
        tag={f.duplicate ? "DUPLICADO" : undefined}
      >
        <DniField
          id="dni"
          name="dni"
          required
          className={inputMonoClass}
          value={f.values.dni}
          onValueChange={(value) => f.setValue("dni", value)}
          onBlur={() => f.blur("dni")}
          invalid={f.invalid("dni")}
          describedBy={f.error("dni") ? "dni-error" : undefined}
        />
      </Field>
      {f.duplicate ? (
        <ExistingRecordCard
          name={f.duplicate.name}
          kindLabel={f.duplicate.kindLabel}
          loadedOn={f.duplicate.loadedOn}
          href={f.duplicate.href}
        />
      ) : null}

      <Field id="phone" label="Teléfono" error={f.error("phone")}>
        <PhoneField
          id="phone"
          name="phone"
          className={inputMonoClass}
          value={f.values.phone}
          onValueChange={(value) => f.setValue("phone", value)}
          onBlur={() => f.blur("phone")}
          invalid={f.invalid("phone")}
          describedBy={f.error("phone") ? "phone-error" : undefined}
        />
      </Field>

      <Field id="address" label="Dirección">
        <AddressField
          id="address"
          name="address"
          className={inputClass}
          value={f.values.address}
          onValueChange={(value) => f.setValue("address", value)}
          onBlur={() => f.blur("address")}
        />
      </Field>
    </>
  );
}
