import { inputErrorClass } from "@/components/ui/styles";

// Props comunes de los campos con formato (nombre, DNI, telefono, patente,
// direccion). Sin `value` el campo maneja su propio estado (formularios de
// edicion, con defaultValue); con `value` + `onValueChange` es controlado por
// el formulario, que asi puede validar y habilitar el boton de guardar.
export type FieldProps = {
  id: string;
  name: string;
  required?: boolean;
  className?: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
  describedBy?: string;
};

export function fieldClass(className: string | undefined, invalid: boolean | undefined): string {
  return `${className ?? ""} ${invalid ? inputErrorClass : ""}`.trim();
}
