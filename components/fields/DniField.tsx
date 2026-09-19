"use client";

import { useState } from "react";

import { formatDniInput } from "@/utils/dni";

import { fieldClass, type FieldProps } from "./fieldProps";

export function DniField({
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
  const [internal, setInternal] = useState(formatDniInput(defaultValue));

  return (
    <input
      id={id}
      name={name}
      required={required}
      className={fieldClass(className, invalid)}
      inputMode="numeric"
      placeholder="XX.XXX.XXX"
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      value={value ?? internal}
      onBlur={onBlur}
      onChange={(event) => {
        const next = formatDniInput(event.target.value);
        if (value === undefined) setInternal(next);
        onValueChange?.(next);
      }}
    />
  );
}
