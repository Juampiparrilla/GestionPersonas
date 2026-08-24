"use client";

import { useState } from "react";

import { formatPlateInput } from "@/utils/plate";

export function PlateField({
  id,
  name,
  required,
  className,
  defaultValue = "",
}: {
  id: string;
  name: string;
  required?: boolean;
  className?: string;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(formatPlateInput(defaultValue));

  return (
    <input
      id={id}
      name={name}
      required={required}
      className={className}
      placeholder="AB123CD"
      value={value}
      onChange={(event) => setValue(formatPlateInput(event.target.value))}
    />
  );
}
