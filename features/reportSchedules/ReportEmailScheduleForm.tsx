"use client";

import { Send } from "lucide-react";
import { useActionState, useState, useTransition } from "react";

import { Spinner } from "@/components/Spinner";
import { REPORT_TYPE_LABEL, type ReportType } from "@/lib/email/reportTypes";

import { sendTestReportEmailAction, setReportEmailScheduleAction, type ReportEmailScheduleState } from "./actions";
import type { ReportEmailSchedule } from "./queries";

const REPORT_TYPES: ReportType[] = ["dirigentes", "punteros", "personas", "vehiculos"];
const DAY_OF_WEEK_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const initialState: ReportEmailScheduleState = { error: null, success: false };
const inputClassName =
  "h-12 w-full rounded-[14px] border border-line-input bg-surface px-3.5 text-base text-ink focus:border-[1.5px] focus:border-ink focus:outline-none";

export function ReportEmailScheduleForm({ initialSchedule }: { initialSchedule: ReportEmailSchedule }) {
  const [state, formAction, pending] = useActionState(setReportEmailScheduleAction, initialState);

  const [enabled, setEnabled] = useState(initialSchedule.enabled);
  const [recipientEmail, setRecipientEmail] = useState(initialSchedule.recipientEmail ?? "");
  const [frequency, setFrequency] = useState(initialSchedule.frequency);
  const [dayOfWeek, setDayOfWeek] = useState(String(initialSchedule.dayOfWeek ?? 1));
  const [dayOfMonth, setDayOfMonth] = useState(String(initialSchedule.dayOfMonth ?? 1));
  const [reportTypes, setReportTypes] = useState<ReportType[]>(initialSchedule.reportTypes);

  const [isTestPending, startTestTransition] = useTransition();
  const [testResult, setTestResult] = useState<string | null>(null);

  function toggleReportType(type: ReportType) {
    setReportTypes((prev) => (prev.includes(type) ? prev.filter((value) => value !== type) : [...prev, type]));
  }

  function handleSendTest() {
    setTestResult(null);
    startTestTransition(async () => {
      const result = await sendTestReportEmailAction(recipientEmail, reportTypes);
      setTestResult(result.ok ? "¡Enviado! Revisá la casilla de destino." : result.error);
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex items-center gap-2 text-[13px] font-semibold text-ink-label">
        <input
          type="checkbox"
          name="enabled"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
          className="h-4 w-4"
        />
        Enviar reportes automáticamente por correo
      </label>

      <div className="flex flex-col gap-1">
        <label htmlFor="recipientEmail" className="text-[13px] font-semibold text-ink-label">
          Correo destinatario
        </label>
        <input
          id="recipientEmail"
          name="recipientEmail"
          type="email"
          value={recipientEmail}
          onChange={(event) => setRecipientEmail(event.target.value)}
          className={inputClassName}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-semibold text-ink-label">Reportes a incluir</label>
        <div className="flex flex-wrap gap-3">
          {REPORT_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-1.5 text-sm text-ink-label">
              <input
                type="checkbox"
                name="reportTypes"
                value={type}
                checked={reportTypes.includes(type)}
                onChange={() => toggleReportType(type)}
                className="h-4 w-4"
              />
              {REPORT_TYPE_LABEL[type]}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="frequency" className="text-[13px] font-semibold text-ink-label">
          Frecuencia
        </label>
        <select
          id="frequency"
          name="frequency"
          value={frequency}
          onChange={(event) => setFrequency(event.target.value as ReportEmailSchedule["frequency"])}
          className={inputClassName}
        >
          <option value="daily">Diaria</option>
          <option value="weekly">Semanal</option>
          <option value="monthly">Mensual</option>
        </select>
      </div>

      {frequency === "weekly" ? (
        <div className="flex flex-col gap-1">
          <label htmlFor="dayOfWeek" className="text-[13px] font-semibold text-ink-label">
            Día de la semana
          </label>
          <select
            id="dayOfWeek"
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
          <label htmlFor="dayOfMonth" className="text-[13px] font-semibold text-ink-label">
            Día del mes (1 a 28)
          </label>
          <input
            id="dayOfMonth"
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

      <p className="text-xs text-ink-2">
        El envío automático corre una vez al día (horario aproximado 03:00 hs, Argentina) — con el plan actual de
        Vercel no se puede elegir una hora exacta.
      </p>

      {state.error ? (
        <p role="alert" className="text-sm text-err-text">
          {state.error}
        </p>
      ) : null}
      {state.success ? <p className="text-sm text-green-700">Configuración guardada.</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex h-[52px] items-center justify-center gap-2 rounded-[15px] bg-accent px-6 text-base font-semibold text-white transition-colors active:bg-accent-press disabled:bg-disabled-bg disabled:text-disabled-ink"
        >
          {pending ? <Spinner className="h-4 w-4" /> : null}
          Guardar configuración
        </button>
        <button
          type="button"
          onClick={handleSendTest}
          disabled={isTestPending}
          className="flex h-[52px] items-center justify-center gap-2 rounded-[15px] border border-line-input bg-surface px-6 text-base font-semibold text-ink-label active:bg-muted disabled:opacity-60"
        >
          {isTestPending ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" aria-hidden="true" />}
          Enviar prueba
        </button>
      </div>

      {testResult ? (
        <p className={testResult.startsWith("¡Enviado") ? "text-sm text-green-700" : "text-sm text-err-text"}>
          {testResult}
        </p>
      ) : null}
    </form>
  );
}
