"use server";

import { revalidatePath } from "next/cache";

import { getRequestMeta } from "@/lib/request-meta";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { VehicleType } from "@/types/domain";
import { collectFieldErrors, rpcFieldErrors, type FieldErrors } from "@/utils/form-errors";
import { normalizePhone } from "@/utils/phone";
import { friendlyRpcError } from "@/utils/rpc-errors";
import { validateDni, validateFullName, validatePhone, validatePlate } from "@/utils/validation";

const VEHICLE_TYPES: VehicleType[] = ["auto", "moto", "traffic", "colectivo"];

function isVehicleType(value: string): value is VehicleType {
  return (VEHICLE_TYPES as string[]).includes(value);
}

export type CreateVehicleState = { error: string | null; success: boolean; fieldErrors?: FieldErrors };

export async function createVehicleAction(
  _prevState: CreateVehicleState,
  formData: FormData
): Promise<CreateVehicleState> {
  const type = String(formData.get("type") ?? "");
  const plate = String(formData.get("plate") ?? "").trim();
  const driverFullName = String(formData.get("driverFullName") ?? "").trim();
  const driverDni = String(formData.get("driverDni") ?? "").trim();
  const driverPhone = String(formData.get("driverPhone") ?? "").trim();
  // Solo lo llena CreateVehicleForm cuando lo usa la carga asistida del
  // Administrador de Organización (ver features/carga-asistida).
  const targetLeaderId = String(formData.get("leaderId") ?? "").trim();

  const fieldErrors = collectFieldErrors({
    type: isVehicleType(type) ? null : "Elegí un tipo de vehículo.",
    plate: validatePlate(plate),
    driverFullName: validateFullName(driverFullName),
    driverDni: validateDni(driverDni),
    driverPhone: validatePhone(driverPhone),
  });
  if (fieldErrors || !isVehicleType(type)) {
    return { error: null, success: false, fieldErrors: fieldErrors ?? {} };
  }

  const session = await getSessionContext();
  if (!session) {
    return { error: "No tenés permiso para hacer esto.", success: false };
  }

  let leaderId: string;
  if (session.role === "leader" && session.leaderId) {
    leaderId = session.leaderId;
  } else if (session.role === "superadmin" && targetLeaderId) {
    // fn_create_vehicle ya valida que ese dirigente pertenezca a la
    // organizacion del que llama.
    leaderId = targetLeaderId;
  } else {
    return { error: "No tenés permiso para hacer esto.", success: false };
  }

  const supabase = await createClient();
  const { ip, userAgent } = await getRequestMeta();

  const { error } = await supabase.rpc("fn_create_vehicle", {
    p_leader_id: leaderId,
    p_type: type,
    p_plate: plate,
    p_driver_full_name: driverFullName,
    p_driver_dni: driverDni,
    p_driver_phone: normalizePhone(driverPhone),
    p_ip: ip,
    p_user_agent: userAgent,
  });

  if (error) {
    const rpcErrors = rpcFieldErrors(error.message);
    if (rpcErrors) {
      return { error: null, success: false, fieldErrors: rpcErrors };
    }
    return { error: friendlyRpcError(error.message), success: false };
  }

  revalidatePath("/dirigente/vehiculos");
  revalidatePath("/superadmin/carga-asistida");
  return { error: null, success: true };
}

export type ActionResult = { error: string | null };

export async function updateVehicleAction(
  vehicleId: string,
  type: VehicleType,
  plate: string,
  driverFullName: string,
  driverDni: string,
  driverPhone: string | null
): Promise<ActionResult> {
  const phoneError = driverPhone ? validatePhone(driverPhone) : null;
  if (phoneError) {
    return { error: phoneError };
  }

  const supabase = await createClient();
  const { ip, userAgent } = await getRequestMeta();

  const { error } = await supabase.rpc("fn_update_vehicle", {
    p_vehicle_id: vehicleId,
    p_type: type,
    p_plate: plate,
    p_driver_full_name: driverFullName,
    p_driver_dni: driverDni,
    p_driver_phone: driverPhone ? normalizePhone(driverPhone) : null,
    p_ip: ip,
    p_user_agent: userAgent,
  });

  if (error) {
    return { error: friendlyRpcError(error.message) };
  }

  revalidatePath("/dirigente/vehiculos");
  return { error: null };
}

export async function removeVehicleAction(vehicleId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { ip, userAgent } = await getRequestMeta();

  const { error } = await supabase.rpc("fn_remove_vehicle", {
    p_vehicle_id: vehicleId,
    p_ip: ip,
    p_user_agent: userAgent,
  });

  if (error) {
    return { error: friendlyRpcError(error.message) };
  }

  revalidatePath("/dirigente/vehiculos");
  return { error: null };
}
