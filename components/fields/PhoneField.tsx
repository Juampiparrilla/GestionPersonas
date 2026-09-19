"use client";

import { useState } from "react";

import { formatPhoneInput, normalizePhone, PHONE_EXAMPLE } from "@/utils/phone";

import { fieldClass, type FieldProps } from "./fieldProps";

export function PhoneField({
  id,
  name,
  className,
  defaultValue = "",
  value,
  onValueChange,
  onBlur,
  invalid,
  describedBy,
}: FieldProps) {
  const [internal, setInternal] = useState(formatPhoneInput(defaultValue));

  function commit(next: string) {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  }

  return (
    <input
      id={id}
      name={name}
      className={fieldClass(className, invalid)}
      inputMode="tel"
      autoComplete="tel"
      placeholder={PHONE_EXAMPLE}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      value={value ?? internal}
      onBlur={() => {
        // Al salir del campo se completa el formato ("4763833" -> "381
        // 476-3833") si el numero es valido.
        const current = value ?? internal;
        const normalized = normalizePhone(current);
        if (normalized && normalized !== current) commit(normalized);
        onBlur?.();
      }}
      onChange={(event) => commit(formatPhoneInput(event.target.value))}
    />
  );
}
