import { fetchAuditLogsAction } from "@/features/audit/actions";
import { formatActivityTime } from "@/features/audit/dates";
import { listAllPeopleGroupedByLeader } from "@/features/people/queries";
import { listAllPointersGroupedByLeader } from "@/features/pointers/queries";
import { listAllVehiclesGroupedByLeader } from "@/features/vehicles/queries";
import { VEHICLE_TYPE_LABEL } from "@/features/vehicles/vehicleTypeLabel";
import { formatPhoneDisplay } from "@/utils/phone";

import type { LeaderDetailData } from "./detailTypes";

const ACTIVITY_LIMIT = 3;

// Lo que cuelga de un dirigente (punteros, personas, vehiculos) y su ultima
// actividad, ya en el formato de la ficha. Lo usan la pantalla de detalle
// (movil) y el panel lateral de escritorio.
export async function loadLeaderDetailData(leaderId: string): Promise<LeaderDetailData> {
  const [pointerGroups, peopleGroups, vehicleGroups, logs] = await Promise.all([
    listAllPointersGroupedByLeader(),
    listAllPeopleGroupedByLeader(),
    listAllVehiclesGroupedByLeader(),
    fetchAuditLogsAction({ leaderId }),
  ]);

  const pointers = (pointerGroups.find((group) => group.leaderId === leaderId)?.pointers ?? []).map(
    (pointer) => ({
      id: pointer.id,
      name: pointer.fullName,
      meta: `DNI ${pointer.dni} · ${pointer.peopleCount} ${pointer.peopleCount === 1 ? "persona" : "personas"}`,
    })
  );

  const people = (peopleGroups.find((group) => group.leaderId === leaderId)?.pointerGroups ?? []).flatMap(
    (pointerGroup) =>
      pointerGroup.people.map((person) => ({
        id: person.id,
        name: person.fullName,
        meta: `DNI ${person.dni}${person.phone ? ` · ${formatPhoneDisplay(person.phone)}` : ""} · ${pointerGroup.pointerName}`,
      }))
  );

  const vehicles = (vehicleGroups.find((group) => group.leaderId === leaderId)?.vehicles ?? []).map(
    (vehicle) => ({
      id: vehicle.id,
      name: vehicle.plate,
      meta: `${VEHICLE_TYPE_LABEL[vehicle.type]} · ${vehicle.driverFullName}`,
    })
  );

  const activity = logs.slice(0, ACTIVITY_LIMIT).map((log) => ({
    id: log.id,
    time: formatActivityTime(log.createdAt),
    description: log.description,
  }));

  return { pointers, people, vehicles, activity };
}
