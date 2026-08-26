import { execSync } from "node:child_process";
import fs from "node:fs";

import { createClient } from "@supabase/supabase-js";

// Corrido por .github/workflows/backup.yml, con service_role -- nunca desde
// el cliente ni con la sesion de un usuario. Hace UN dump completo de toda
// la base (no uno por organizacion: ver el comentario largo en el workflow)
// y despues registra, para cada organizacion a la que le toca hoy segun su
// propia backup_schedules, una fila en scheduled_job_runs (kind='backup') --
// ese historial es lo unico que ve cada Administrador de Organizacion, nunca
// el archivo en si.
const REPORT_TIME_ZONE = "America/Argentina/Buenos_Aires";
const GLOBAL_RETENTION = 30;

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = process.env.SUPABASE_DB_URL;
const forceOrganizationId = process.env.FORCE_ORGANIZATION_ID || null;

if (!url || !key || !dbUrl) {
  console.error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_DB_URL.");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const now = new Date();
const dateLabel = new Intl.DateTimeFormat("en-CA", { timeZone: REPORT_TIME_ZONE }).format(now);
const fileName = `${dateLabel}_${now.getTime()}.dump`;
const localPath = `/tmp/${fileName}`;

async function getDueOrganizationIds() {
  const { data: schedules } = await admin
    .from("backup_schedules")
    .select("organization_id, frequency, day_of_week, day_of_month")
    .eq("enabled", true);

  // "Generar respaldo ahora" (workflow_dispatch manual desde la app): solo
  // cuenta a ESA organizacion, sin importar si hoy le tocaba segun su
  // frecuencia -- es un pedido explicito, no la corrida programada.
  if (forceOrganizationId) {
    return [forceOrganizationId];
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: REPORT_TIME_ZONE,
    weekday: "short",
    day: "2-digit",
  }).formatToParts(now);
  const weekdayShort = parts.find((part) => part.type === "weekday")?.value ?? "Sun";
  const dayOfMonth = Number(parts.find((part) => part.type === "day")?.value ?? "1");
  const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dayOfWeek = WEEKDAY_INDEX[weekdayShort] ?? 0;

  return (schedules ?? [])
    .filter(
      (schedule) =>
        schedule.frequency === "daily" ||
        (schedule.frequency === "weekly" && schedule.day_of_week === dayOfWeek) ||
        (schedule.frequency === "monthly" && schedule.day_of_month === dayOfMonth)
    )
    .map((schedule) => schedule.organization_id);
}

async function recordRuns(organizationIds, status, detail) {
  if (organizationIds.length === 0) return;
  await admin.from("scheduled_job_runs").insert(
    organizationIds.map((organizationId) => ({
      organization_id: organizationId,
      kind: "backup",
      status,
      detail,
    }))
  );
}

const organizationIds = await getDueOrganizationIds();

let dumpError = null;
try {
  execSync(`pg_dump "${dbUrl}" -Fc -f ${localPath}`, { stdio: "inherit" });
} catch (err) {
  dumpError = err instanceof Error ? err.message : String(err);
}

if (dumpError) {
  console.error("pg_dump fallo:", dumpError);
  await recordRuns(organizationIds, "error", { error: dumpError });
  process.exit(1);
}

const fileBuffer = fs.readFileSync(localPath);
const storagePath = `dumps/${fileName}`;
const { error: uploadError } = await admin.storage
  .from("backups")
  .upload(storagePath, fileBuffer, { contentType: "application/octet-stream" });

if (uploadError) {
  console.error("subida fallo:", uploadError.message);
  await recordRuns(organizationIds, "error", { error: uploadError.message });
  process.exit(1);
}

// Retencion global sobre el archivo compartido (no es por organizacion: es
// UN dump para toda la base) -- conserva los mas recientes, borra el resto.
const { data: files } = await admin.storage
  .from("backups")
  .list("dumps", { limit: 1000, sortBy: { column: "name", order: "asc" } });

if (files && files.length > GLOBAL_RETENTION) {
  const toDelete = files.slice(0, files.length - GLOBAL_RETENTION).map((file) => `dumps/${file.name}`);
  if (toDelete.length > 0) {
    await admin.storage.from("backups").remove(toDelete);
  }
}

await recordRuns(organizationIds, "success", { path: storagePath, size_bytes: fileBuffer.length });

console.log(`Backup ok: ${storagePath} (${fileBuffer.length} bytes), organizaciones registradas: ${organizationIds.length}`);
