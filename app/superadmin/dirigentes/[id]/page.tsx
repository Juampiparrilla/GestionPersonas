import { notFound } from "next/navigation";

import { fetchAuditLogsAction } from "@/features/audit/actions";
import { formatActivityTime } from "@/features/audit/dates";
import { LeaderDetailClient } from "@/features/leaders/LeaderDetailClient";
import { listActiveLeaders } from "@/features/leaders/queries";
import { listAllPeopleGroupedByLeader } from "@/features/people/queries";
import { listAllPointersGroupedByLeader } from "@/features/pointers/queries";
import { listAllVehiclesGroupedByLeader } from "@/features/vehicles/queries";
import { VEHICLE_TYPE_LABEL } from "@/features/vehicles/vehicleTypeLabel";

const ACTIVITY_LIMIT = 3;

export default async function LeaderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [leaders, pointerGroups, peopleGroups, vehicleGroups, logs] = await Promise.all([
    listActiveLeaders(),
    listAllPointersGroupedByLeader(),
    listAllPeopleGroupedByLeader(),
    listAllVehiclesGroupedByLeader(),
    fetchAuditLogsAction({ leaderId: id }),
  ]);

  const leader = leaders.find((item) => item.id === id);
  if (!leader) {
    notFound();
  }

  const pointers = (pointerGroups.find((group) => group.leaderId === id)?.pointers ?? []).map(
    (pointer) => ({
      id: pointer.id,
      name: pointer.fullName,
      meta: `DNI ${pointer.dni} · ${pointer.peopleCount} ${pointer.peopleCount === 1 ? "persona" : "personas"}`,
    })
  );

  const people = (peopleGroups.find((group) => group.leaderId === id)?.pointerGroups ?? []).flatMap(
    (pointerGroup) =>
      pointerGroup.people.map((person) => ({
        id: person.id,
        name: person.fullName,
        meta: `DNI ${person.dni} · ${pointerGroup.pointerName}`,
      }))
  );

  const vehicles = (vehicleGroups.find((group) => group.leaderId === id)?.vehicles ?? []).map(
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

  return (
    <LeaderDetailClient
      leader={leader}
      pointers={pointers}
      people={people}
      vehicles={vehicles}
      activity={activity}
    />
  );
}
