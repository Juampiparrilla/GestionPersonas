import { CountChip } from "@/components/ui/Chip";
import { EntityRow } from "@/components/ui/EntityRow";
import { formatPhoneDisplay } from "@/utils/phone";

import type { PointerListItem } from "./queries";

// Un puntero tiene personas colgando: la fila abre su ficha (con la lista de
// personas y las acciones de editar / quitar), igual que un dirigente.
export function PointerCard({ pointer }: { pointer: PointerListItem }) {
  return (
    <EntityRow
      href={`/dirigente/punteros/${pointer.id}`}
      name={pointer.fullName}
      meta={`DNI ${pointer.dni}${pointer.phone ? ` · ${formatPhoneDisplay(pointer.phone)}` : ""}`}
      chips={<CountChip count={pointer.peopleCount} singular="persona" plural="personas" />}
    />
  );
}
