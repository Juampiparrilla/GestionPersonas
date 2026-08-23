"use client";

import { useState } from "react";

import { formatDniInput } from "@/utils/dni";

export function DniField({
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
  const [value, setValue] = useState(formatDniInput(defaultValue));

  return (
    <input
      id={id}
      name={name}
      required={required}
      className={className}
      inputMode="numeric"
      placeholder="XX.XXX.XXX"
      value={value}
      onChange={(event) => setValue(formatDniInput(event.target.value))}
    />
  );
}
