import { Car, UserRound, UserRoundCheck, UsersRound } from "lucide-react";

// Un icono por tipo de registro, el mismo en la barra de navegacion y en los
// botones de "Agregar": asi se reconoce en que pantalla se esta.
export const ENTITY_ICON = {
  leader: UsersRound,
  pointer: UserRoundCheck,
  person: UserRound,
  vehicle: Car,
} as const;
