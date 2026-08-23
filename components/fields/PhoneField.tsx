"use client";

import { useState } from "react";

import { formatPhoneInput } from "@/utils/phone";

export function PhoneField({
  id,
  name,
  className,
  defaultValue = "",
}: {
  id: string;
  name: string;
  className?: string;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <input
      id={id}
      name={name}
      className={className}
      inputMode="tel"
      autoComplete="tel"
      placeholder="3815551234"
      value={value}
      onChange={(event) => setValue(formatPhoneInput(event.target.value))}
    />
  );
}
