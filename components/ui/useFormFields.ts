"use client";

import { useEffect, useState } from "react";

import type { FieldErrors } from "@/utils/form-errors";

// Estado y validacion por campo de un formulario:
//  - El mensaje de error de un campo aparece al salir de el (blur), no
//    mientras se escribe.
//  - Los errores que devuelve el servidor se muestran hasta que se edita ese
//    campo, y el primer campo con error recibe el foco.
//  - `canSubmit` es falso mientras algun campo tenga un error de formato o
//    falte un obligatorio (el boton de guardar queda deshabilitado).
export function useFormFields<K extends string>({
  initial,
  validators,
  serverErrors,
  order,
}: {
  initial: Record<K, string>;
  // Validador por campo: devuelve el mensaje de error o null. Un campo sin
  // validador nunca da error.
  validators: Partial<Record<K, (value: string) => string | null>>;
  serverErrors: FieldErrors | undefined;
  // Orden de los campos, para decidir cual recibe el foco.
  order: K[];
}) {
  const [values, setValues] = useState<Record<K, string>>(initial);
  const [touched, setTouched] = useState<Partial<Record<K, boolean>>>({});

  // Patron "ajustar estado durante el render" para reaccionar a errores
  // nuevos del servidor: https://react.dev/learn/you-might-not-need-an-effect
  const [seenServerErrors, setSeenServerErrors] = useState(serverErrors);
  const [edited, setEdited] = useState<Partial<Record<K, boolean>>>({});
  if (serverErrors !== seenServerErrors) {
    setSeenServerErrors(serverErrors);
    setEdited({});
  }

  useEffect(() => {
    if (!serverErrors) return;
    const first = order.find((field) => serverErrors[field]);
    if (first) document.getElementById(first)?.focus();
    // `order` es una constante del formulario que lo usa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverErrors]);

  function clientError(field: K): string | null {
    const validate = validators[field];
    return validate ? validate(values[field]) : null;
  }

  function serverError(field: K): string | null {
    return edited[field] ? null : (serverErrors?.[field] ?? null);
  }

  function error(field: K): string | null {
    return serverError(field) ?? (touched[field] ? clientError(field) : null);
  }

  function setValue(field: K, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setEdited((current) => ({ ...current, [field]: true }));
  }

  function blur(field: K) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  const canSubmit = order.every((field) => clientError(field) === null);

  return { values, error, setValue, blur, canSubmit };
}
