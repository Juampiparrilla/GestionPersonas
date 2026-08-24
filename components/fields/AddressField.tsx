"use client";

import { useState } from "react";

import { formatAddressInput } from "@/utils/address";

export function AddressField({
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
      autoComplete="street-address"
      placeholder="Calle 123 - Barrio Norte"
      value={value}
      onChange={(event) => setValue(formatAddressInput(event.target.value))}
    />
  );
}
