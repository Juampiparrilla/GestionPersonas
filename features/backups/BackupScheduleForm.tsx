"use client";

import { CircleCheck, CircleX, DatabaseBackup } from "lucide-react";
import { useActionState, useState, useTransition } from "react";

import { Spinner } from "@/components/Spinner";

import { setBackupScheduleAction, triggerBackupNowAction, type BackupScheduleState } from "./actions";
import type { BackupRun, BackupSchedule } from "./queries";

const DAY_OF_WEEK_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const initialState: BackupScheduleState = { error: null, success: false };
const inputClassName =
  "h-12 rounded-lg border border-zinc-300 px-4 text-base text-zinc-900 focus:border-zinc-500 focus:outline-none";

export function BackupScheduleForm({
  initialSchedule,
  initialRuns,
}: {
  initialSchedule: BackupSchedule;
  initialRuns: BackupRun[];
}) {
  const [state, formAction, pending] = useActionState(setBackupScheduleAction, initialState);

  const [frequency, setFrequency] = useState(initialSchedule.frequency);
  const [dayOfWeek, setDayOfWeek] = useState(String(initialSchedule.dayOfWeek ?? 1));
  const [dayOfMonth, setDayOfMonth] = useState(String(initialSchedule.dayOfMonth ?? 1));

  const [isTriggerPending, startTriggerTransition] = useTransition();
  const [triggerResult, setTriggerResult] = useState<string | null>(null);

  function handleTriggerNow() {
    setTriggerResult(null);
    startTriggerTransition(async () => {
      const result = await triggerBackupNowAction();
      setTriggerResult(
        result.ok
          ? "Backup disparado. Puede tardar unos minutos en aparecer en el historial."
          : result.error
      );
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
          <input type="checkbox" name="enabled" defaultChecked={initialSchedule.enabled} className="h-4 w-4" />
          Contar a mi organización en el backup automático
        </label>

        <div className="flex flex-col gap-1">
          <label htmlFor="backupFrequency" className="text-sm font-medium text-zinc-700">
            Frecuencia
          </label>
          <select
            id="backupFrequency"
            name="frequency"
            value={frequency}
            onChange={(event) => setFrequency(event.target.value as BackupSchedule["frequency"])}
            className={inputClassName}
          >
            <option value="daily">Diaria</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
          </select>
        </div>

        {frequency === "weekly" ? (
          <div className="flex flex-col gap-1">
            <label htmlFor="backupDayOfWeek" className="text-sm font-medium text-zinc-700">
              Día de la semana
            </label>
            <select
              id="backupDayOfWeek"
              name="dayOfWeek"
              value={dayOfWeek}
              onChange={(event) => setDayOfWeek(event.target.value)}
              className={inputClassName}
            >
              {DAY_OF_WEEK_LABELS.map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {frequency === "monthly" ? (
          <div className="flex flex-col gap-1">
            <label htmlFor="backupDayOfMonth" className="text-sm font-medium text-zinc-700">
              Día del mes (1 a 28)
            </label>
            <input
              id="backupDayOfMonth"
              name="dayOfMonth"
              type="number"
              min={1}
              max={28}
              value={dayOfMonth}
              onChange={(event) => setDayOfMonth(event.target.value)}
              className={inputClassName}
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-1">
          <label htmlFor="retentionCount" className="text-sm font-medium text-zinc-700">
            Backups a conservar
          </label>
          <input
            id="retentionCount"
            name="retentionCount"
            type="number"
            min={1}
            max={60}
            defaultValue={initialSchedule.retentionCount}
            className={inputClassName}
          />
        </div>

        <p className="text-xs text-zinc-500">
          El backup es un respaldo completo de toda la base de datos (no solo tu organización), generado una vez al
          día. No se puede descargar desde acá — este historial solo confirma que se generó correctamente.
        </p>

        {state.error ? (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        ) : null}
        {state.success ? <p className="text-sm text-green-700">Configuración guardada.</p> : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending}
            className="flex h-12 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-6 text-base font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-60"
          >
            {pending ? <Spinner className="h-4 w-4" /> : null}
            Guardar configuración
          </button>
          <button
            type="button"
            onClick={handleTriggerNow}
            disabled={isTriggerPending}
            className="flex h-12 items-center justify-center gap-2 rounded-lg border border-zinc-300 px-6 text-base font-semibold text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
          >
            {isTriggerPending ? <Spinner className="h-4 w-4" /> : <DatabaseBackup className="h-4 w-4" aria-hidden="true" />}
            Generar respaldo ahora
          </button>
        </div>

        {triggerResult ? (
          <p className={triggerResult.startsWith("Backup disparado") ? "text-sm text-green-700" : "text-sm text-red-600"}>
            {triggerResult}
          </p>
        ) : null}
      </form>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-zinc-700">Historial reciente</p>
        {initialRuns.length === 0 ? (
          <p className="text-sm text-zinc-500">Todavía no hay backups registrados para tu organización.</p>
        ) : (
          initialRuns.map((run) => (
            <div key={run.id} className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2">
              {run.status === "success" ? (
                <CircleCheck className="h-4 w-4 shrink-0 text-green-600" aria-hidden="true" />
              ) : (
                <CircleX className="h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
              )}
              <span className="text-sm text-zinc-900">
                {run.status === "success" ? "Backup exitoso" : "Backup con error"}
              </span>
              <span className="ml-auto text-xs text-zinc-400">
                {new Date(run.createdAt).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
