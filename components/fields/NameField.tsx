"use client";

import { useState } from "react";

import { formatNameInput } from "@/utils/name";

export function NameField({
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
  const [value, setValue] = useState(defaultValue);

  return (
    <input
      id={id}
      name={name}
      required={required}
      className={className}
      autoComplete="name"
      value={value}
      onChange={(event) => setValue(formatNameInput(event.target.value))}
    />
  );
}
