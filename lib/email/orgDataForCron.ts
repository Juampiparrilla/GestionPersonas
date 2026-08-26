import "server-only";

import type { LeaderListItem } from "@/features/leaders/queries";
import type { PersonLeaderGroup } from "@/features/people/queries";
import type { PointerLeaderGroup } from "@/features/pointers/queries";
import type { VehicleLeaderGroup } from "@/features/vehicles/queries";
import { createAdminClient } from "@/lib/supabase/admin";

// Version "para el cron" de las 4 consultas ya existentes en cada
// features/*/queries.ts: esas usan el cliente de sesion (RLS filtra por la
// organizacion de quien esta logueado), pero el cron corre con
// service_role, sin sesion de usuario, para TODAS las organizaciones.
//
// OJO: `leaders`, `pointers` y `registered_people` NO tienen columna
// `organization_id` propia (heredan la organizacion via `individuals`, cuyo
// `id` coincide con el suyo) -- por eso el filtro por organizacion se hace
// siempre a traves de `individuals` primero, nunca `.eq("organization_id",
// ...)` directo sobre esas tres tablas (si tuvieran esa columna no haria
// falta este paso intermedio). `vehicles` si tiene `organization_id`
// propio, ese se filtra directo.
//
// Se mantienen separadas de las funciones de sesion ya existentes (no se
// les agrega un parametro opcional) para no complicar esas funciones, ya
// usadas en varias pantallas, con una rama que solo necesita este job en
// batch.
export async function getLeadersForOrgCron(organizationId: string): Promise<LeaderListItem[]> {
  const admin = createAdminClient();

  const { data: individuals } = await admin
    .from("individuals")
    .select("id, full_name, dni_display, phone, address")
    .eq("organization_id", organizationId)
    .eq("position", "leader")
    .eq("status", "active");
  const leaderIds = (individuals ?? []).map((row) => row.id);
  if (leaderIds.length === 0) return [];

  const { data: leaders } = await admin
    .from("leaders")
    .select("id, access_status, profile_id")
    .in("id", leaderIds)
    .eq("is_removed", false);

  const { data: pointerRows } = await admin
    .from("pointers")
    .select("id, leader_id")
    .in("leader_id", leaderIds)
    .eq("is_removed", false);
  const { data: vehicleRows } = await admin
    .from("vehicles")
    .select("leader_id")
    .eq("organization_id", organizationId)
    .eq("is_removed", false);

  const pointerCountByLeader = new Map<string, number>();
  const pointerIds: string[] = [];
  const leaderIdByPointer = new Map<string, string>();
  for (const row of pointerRows ?? []) {
    pointerCountByLeader.set(row.leader_id, (pointerCountByLeader.get(row.leader_id) ?? 0) + 1);
    leaderIdByPointer.set(row.id, row.leader_id);
    pointerIds.push(row.id);
  }

  const vehicleCountByLeader = new Map<string, number>();
  for (const row of vehicleRows ?? []) {
    vehicleCountByLeader.set(row.leader_id, (vehicleCountByLeader.get(row.leader_id) ?? 0) + 1);
  }

  const personCountByLeader = new Map<string, number>();
  if (pointerIds.length > 0) {
    const { data: peopleRows } = await admin
      .from("registered_people")
      .select("pointer_id")
      .in("pointer_id", pointerIds)
      .eq("is_removed", false);
    for (const row of peopleRows ?? []) {
      const leaderId = leaderIdByPointer.get(row.pointer_id);
      if (!leaderId) continue;
      personCountByLeader.set(leaderId, (personCountByLeader.get(leaderId) ?? 0) + 1);
    }
  }

  const individualsById = new Map((individuals ?? []).map((row) => [row.id, row]));

  const items: LeaderListItem[] = [];
  for (const leader of leaders ?? []) {
    const individual = individualsById.get(leader.id);
    if (!individual) continue;
    items.push({
      id: leader.id,
      fullName: individual.full_name,
      dni: individual.dni_display,
      phone: individual.phone,
      address: individual.address,
      accessStatus: leader.access_status,
      pointerCount: pointerCountByLeader.get(leader.id) ?? 0,
      personCount: personCountByLeader.get(leader.id) ?? 0,
      vehicleCount: vehicleCountByLeader.get(leader.id) ?? 0,
      hasAccess: Boolean(leader.profile_id),
      accepted: false,
    });
  }

  return items.sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));
}

export async function getPointerGroupsForOrgCron(organizationId: string): Promise<PointerLeaderGroup[]> {
  const admin = createAdminClient();

  const [{ data: leaderIndividuals }, { data: pointerIndividuals }] = await Promise.all([
    admin
      .from("individuals")
      .select("id, full_name")
      .eq("organization_id", organizationId)
      .eq("position", "leader")
      .eq("status", "active"),
    admin
      .from("individuals")
      .select("id, full_name, dni_display, phone, address")
      .eq("organization_id", organizationId)
      .eq("position", "pointer")
      .eq("status", "active"),
  ]);

  const leaderIds = (leaderIndividuals ?? []).map((row) => row.id);
  const { data: pointers } =
    leaderIds.length > 0
      ? await admin.from("pointers").select("id, leader_id").in("leader_id", leaderIds).eq("is_removed", false)
      : { data: [] as { id: string; leader_id: string }[] };

  const pointerIds = (pointers ?? []).map((row) => row.id);
  const { data: peopleRows } =
    pointerIds.length > 0
      ? await admin.from("registered_people").select("pointer_id").in("pointer_id", pointerIds).eq("is_removed", false)
      : { data: [] as { pointer_id: string }[] };

  const peopleCountByPointer = new Map<string, number>();
  for (const row of peopleRows ?? []) {
    peopleCountByPointer.set(row.pointer_id, (peopleCountByPointer.get(row.pointer_id) ?? 0) + 1);
  }

  const pointerIndividualById = new Map((pointerIndividuals ?? []).map((row) => [row.id, row]));

  const groups: PointerLeaderGroup[] = (leaderIndividuals ?? []).map((leader) => ({
    leaderId: leader.id,
    leaderName: leader.full_name,
    pointers: [],
  }));
  const groupByLeaderId = new Map(groups.map((group) => [group.leaderId, group]));

  for (const pointer of pointers ?? []) {
    const individual = pointerIndividualById.get(pointer.id);
    const group = groupByLeaderId.get(pointer.leader_id);
    if (!individual || !group) continue;
    group.pointers.push({
      id: individual.id,
      fullName: individual.full_name,
      dni: individual.dni_display,
      phone: individual.phone,
      address: individual.address,
      peopleCount: peopleCountByPointer.get(pointer.id) ?? 0,
    });
  }

  for (const group of groups) {
    group.pointers.sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));
  }

  return groups.sort((a, b) => a.leaderName.localeCompare(b.leaderName, "es"));
}

export async function getPeopleGroupsForOrgCron(organizationId: string): Promise<PersonLeaderGroup[]> {
  const admin = createAdminClient();

  const [{ data: leaderIndividuals }, { data: pointerIndividuals }, { data: peopleIndividuals }] = await Promise.all([
    admin
      .from("individuals")
      .select("id, full_name")
      .eq("organization_id", organizationId)
      .eq("position", "leader")
      .eq("status", "active"),
    admin
      .from("individuals")
      .select("id, full_name")
      .eq("organization_id", organizationId)
      .eq("position", "pointer")
      .eq("status", "active"),
    admin
      .from("individuals")
      .select("id, full_name, dni_display, phone, address")
      .eq("organization_id", organizationId)
      .eq("position", "person")
      .eq("status", "active"),
  ]);

  const leaderIds = (leaderIndividuals ?? []).map((row) => row.id);
  const { data: pointers } =
    leaderIds.length > 0
      ? await admin.from("pointers").select("id, leader_id").in("leader_id", leaderIds).eq("is_removed", false)
      : { data: [] as { id: string; leader_id: string }[] };

  const pointerIds = (pointers ?? []).map((row) => row.id);
  const { data: peopleRows } =
    pointerIds.length > 0
      ? await admin.from("registered_people").select("id, pointer_id").in("pointer_id", pointerIds).eq("is_removed", false)
      : { data: [] as { id: string; pointer_id: string }[] };

  const peopleIndividualById = new Map((peopleIndividuals ?? []).map((row) => [row.id, row]));
  const pointerIndividualById = new Map((pointerIndividuals ?? []).map((row) => [row.id, row]));

  const groups: PersonLeaderGroup[] = (leaderIndividuals ?? []).map((leader) => ({
    leaderId: leader.id,
    leaderName: leader.full_name,
    pointerGroups: [],
  }));
  const groupByLeaderId = new Map(groups.map((group) => [group.leaderId, group]));

  const pointerGroupByPointerId = new Map<string, PersonLeaderGroup["pointerGroups"][number]>();
  for (const pointer of pointers ?? []) {
    const individual = pointerIndividualById.get(pointer.id);
    const group = groupByLeaderId.get(pointer.leader_id);
    if (!individual || !group) continue;
    const pointerGroup = { pointerId: pointer.id, pointerName: individual.full_name, people: [] };
    group.pointerGroups.push(pointerGroup);
    pointerGroupByPointerId.set(pointer.id, pointerGroup);
  }

  for (const person of peopleRows ?? []) {
    const individual = peopleIndividualById.get(person.id);
    const pointerGroup = pointerGroupByPointerId.get(person.pointer_id);
    if (!individual || !pointerGroup) continue;
    pointerGroup.people.push({
      id: individual.id,
      fullName: individual.full_name,
      dni: individual.dni_display,
      phone: individual.phone,
      address: individual.address,
    });
  }

  return groups.sort((a, b) => a.leaderName.localeCompare(b.leaderName, "es"));
}

export async function getVehicleGroupsForOrgCron(organizationId: string): Promise<VehicleLeaderGroup[]> {
  const admin = createAdminClient();

  const [{ data: leaderIndividuals }, { data: vehicles }] = await Promise.all([
    admin
      .from("individuals")
      .select("id, full_name")
      .eq("organization_id", organizationId)
      .eq("position", "leader")
      .eq("status", "active"),
    admin
      .from("vehicles")
      .select("id, leader_id, type, plate_display, driver_full_name, driver_dni_normalized, driver_phone")
      .eq("organization_id", organizationId)
      .eq("is_removed", false),
  ]);

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

  return groups.sort((a, b) => a.leaderName.localeCompare(b.leaderName, "es"));
}
