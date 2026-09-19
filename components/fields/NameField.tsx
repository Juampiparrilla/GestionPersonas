"use client";

import { useState } from "react";

import { formatNameInput } from "@/utils/name";

import { fieldClass, type FieldProps } from "./fieldProps";

export function NameField({
  id,
  name,
  required,
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
      required={required}
      className={fieldClass(className, invalid)}
      autoComplete="name"
      placeholder="APELLIDO NOMBRE"
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      value={value ?? internal}
      onBlur={onBlur}
      onChange={(event) => {
        const next = formatNameInput(event.target.value);
        if (value === undefined) setInternal(next);
        onValueChange?.(next);
      }}
    />
  );
}
