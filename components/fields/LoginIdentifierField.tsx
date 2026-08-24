"use client";

import { useState } from "react";

import { formatDniInput } from "@/utils/dni";

// Campo "inteligente" para el login: mientras lo que se escribe sean solo
// numeros, se formatea como DNI (XX.XXX.XXX). Apenas aparece una letra o un
// '@', se deja de formatear y se trata como texto libre (correo) -- asi los
// dirigentes ven el formato de DNI sin que se rompa el login del Superadmin,
// que sigue usando su correo.
export function LoginIdentifierField({
  id,
  name,
  required,
  className,
}: {
  id: string;
  name: string;
  required?: boolean;
  className?: string;
}) {
  const [value, setValue] = useState("");

  function handleChange(raw: string) {
    const withoutSpaces = raw.replace(/\s/g, "");
    const looksLikeEmail = /[a-zA-Z@]/.test(withoutSpaces);
    setValue(looksLikeEmail ? withoutSpaces : formatDniInput(withoutSpaces));
  }

  return (
    <input
      id={id}
      name={name}
      required={required}
      className={className}
      type="text"
      autoComplete="username"
      value={value}
      onChange={(event) => handleChange(event.target.value)}
    />
  );
}
