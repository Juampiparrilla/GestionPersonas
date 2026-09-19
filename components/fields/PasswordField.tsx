"use client";

import { useState } from "react";

export function PasswordField({
  id,
  name,
  required,
  autoComplete,
  className,
}: {
  id: string;
  name: string;
  required?: boolean;
  autoComplete?: string;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        required={required}
        autoComplete={autoComplete}
        className={`${className ?? ""} pr-16`}
        type={visible ? "text" : "password"}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute inset-y-0 right-0 flex w-16 items-center justify-center text-[12px] font-semibold uppercase tracking-wide text-ink-2"
      >
        {visible ? "Ocultar" : "Ver"}
      </button>
    </div>
  );
}
