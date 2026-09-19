"use client";

import { useState } from "react";

import { formatAddressInput } from "@/utils/address";

import { fieldClass, type FieldProps } from "./fieldProps";

export function AddressField({
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
  const [internal, setInternal] = useState(defaultValue);

  return (
    <input
      id={id}
      name={name}
      className={fieldClass(className, invalid)}
      autoComplete="street-address"
      placeholder="Calle 123 - Barrio Norte"
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      value={value ?? internal}
      onBlur={onBlur}
      onChange={(event) => {
        const next = formatAddressInput(event.target.value);
        if (value === undefined) setInternal(next);
        onValueChange?.(next);
      }}
    />
  );
}
