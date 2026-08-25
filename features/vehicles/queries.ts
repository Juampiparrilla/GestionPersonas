import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { VehicleType } from "@/types/domain";

export type VehicleListItem = {
  id: string;
  type: VehicleType;
  plate: string;
  driverFullName: string;
  driverDni: string;
  driverPhone: string | null;
};

// A diferencia de punteros/personas, los vehiculos no comparten identidad
// con `individuals` (el conductor no compite por exclusividad), asi que
// todos los campos viven directo en la tabla `vehicles` -- no hace falta
// cruzar con otra tabla.
export async function listMyVehicles(): Promise<VehicleListItem[]> {
  const session = await getSessionContext();
  if (!session || session.role !== "leader" || !session.leaderId) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("vehicles")
    .select("id, type, plate_display, driver_full_name, driver_dni_normalized, driver_phone")
    .eq("leader_id", session.leaderId)
    .eq("is_removed", false);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((vehicle) => ({
      id: vehicle.id,
      type: vehicle.type,
      plate: vehicle.plate_display,
      driverFullName: vehicle.driver_full_name,
      driverDni: vehicle.driver_dni_normalized,
      driverPhone: vehicle.driver_phone,
    }))
    .sort((a, b) => a.plate.localeCompare(b.plate, "es"));
}

export type VehicleLeaderGroup = {
  leaderId: string;
  leaderName: string;
  vehicles: VehicleListItem[];
};

// Vista de Superadmin: TODOS los vehiculos de la organizacion, agrupados por
// dirigente. Incluye dirigentes sin vehiculos para dar el panorama completo.
export async function listAllVehiclesGroupedByLeader(): Promise<VehicleLeaderGroup[]> {
  const session = await getSessionContext();
  if (!session || session.role !== "superadmin") return [];

  const supabase = await createClient();

  const [{ data: leaderIndividuals, error: leadersError }, { data: vehicles, error: vehiclesError }] =
    await Promise.all([
      supabase.from("individuals").select("id, full_name").eq("position", "leader").eq("status", "active"),
      supabase
        .from("vehicles")
        .select("id, leader_id, type, plate_display, driver_full_name, driver_dni_normalized, driver_phone")
        .eq("is_removed", false),
    ]);

  if (leadersError) throw new Error(leadersError.message);
  if (vehiclesError) throw new Error(vehiclesError.message);

  const groups: VehicleLeaderGroup[] = (leaderIndividuals ?? []).map((leader) => ({
    leaderId: leader.id,
    leaderName: leader.full_name,
    vehicles: [],
  }));
  const groupByLeaderId = new Map(groups.map((group) => [group.leaderId, group]));

  for (const vehicle of vehicles ?? []) {
    const group = groupByLeaderId.get(vehicle.leader_id);
    if (!group) continue;
    group.vehicles.push({
      id: vehicle.id,
      type: vehicle.type,
      plate: vehicle.plate_display,
      driverFullName: vehicle.driver_full_name,
      driverDni: vehicle.driver_dni_normalized,
      driverPhone: vehicle.driver_phone,
    });
  }

  for (const group of groups) {
    group.vehicles.sort((a, b) => a.plate.localeCompare(b.plate, "es"));
  }

  return groups.sort((a, b) => a.leaderName.localeCompare(b.leaderName, "es"));
}
