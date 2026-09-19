"use client";

import { useState } from "react";

import { formatPlateInput } from "@/utils/plate";

import { fieldClass, type FieldProps } from "./fieldProps";

export function PlateField({
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
  const [internal, setInternal] = useState(formatPlateInput(defaultValue));

  return (
    <input
      id={id}
      name={name}
      required={required}
      className={fieldClass(className, invalid)}
      placeholder="AB123CD"
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      value={value ?? internal}
      onBlur={onBlur}
      onChange={(event) => {
        const next = formatPlateInput(event.target.value);
        if (value === undefined) setInternal(next);
        onValueChange?.(next);
      }}
    />
  );
}
