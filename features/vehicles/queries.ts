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
