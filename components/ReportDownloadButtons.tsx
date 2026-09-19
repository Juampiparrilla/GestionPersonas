"use client";

import { Download, FileSpreadsheet, FileText, Files } from "lucide-react";
import { useCallback, useState } from "react";

import { Eyebrow } from "@/components/ui/Eyebrow";
import { Sheet } from "@/components/ui/Sheet";
import { btnIcon, btnIconLarge, btnSecondary, btnSecondaryStrong } from "@/components/ui/styles";

const LINK_CLASS = `${btnSecondary} !h-[46px] flex-1`;
const DISABLED_LINK_CLASS =
  "flex h-[46px] flex-1 cursor-not-allowed items-center justify-center gap-1.5 rounded-[15px] border border-line bg-muted text-base font-semibold text-disabled-ink";

function DisabledReportLink({ message }: { message?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className={DISABLED_LINK_CLASS} aria-disabled="true">
        <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
        PDF
      </span>
      {message ? <p className="text-xs text-ink-2">{message}</p> : null}
    </div>
  );
}

// Boton de icono ↓ (52x52) para la barra de accion + hoja con las opciones de
// reporte (PDF / Excel). Antes era un panel desplegable arriba de la lista.
export function ReportDownloadButtons({
  pdfHref,
  excelHref,
  showPdfModes = false,
  showExcel = true,
  primaryLabel,
  secondary,
  disabled = false,
  disabledMessage,
  variant = "icon",
}: {
  // "icon": boton ↓ de 52x52 (va al lado de la accion primaria);
  // "wide": boton de ancho completo "Generar reporte" (pantallas sin accion
  // primaria propia).
  // "header": boton de icono de 40px para la cabecera de las pantallas que
  // muestran la barra de navegacion.
  variant?: "icon" | "wide" | "header";
  pdfHref: string;
  excelHref?: string;
  showPdfModes?: boolean;
  showExcel?: boolean;
  primaryLabel?: string;
  secondary?: {
    label: string;
    pdfHref: string;
    excelHref?: string;
    disabled?: boolean;
    disabledMessage?: string;
  };
  disabled?: boolean;
  disabledMessage?: string;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Generar reporte"
        className={
          variant === "wide" ? btnSecondaryStrong : variant === "header" ? btnIcon : btnIconLarge
        }
      >
        <Download className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        {variant === "wide" ? "Generar reporte" : null}
      </button>

      <Sheet open={open} onClose={close} title="Generar reporte">
        <div className="flex flex-col gap-5 pb-8">
          <div className="flex flex-col gap-2">
            {primaryLabel ? <Eyebrow>{primaryLabel}</Eyebrow> : null}
            {disabled ? (
              <DisabledReportLink message={disabledMessage} />
            ) : showPdfModes ? (
              <>
                <a href={`${pdfHref}?mode=combined`} className={LINK_CLASS}>
                  <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
                  PDF - Sin saltos de línea
                </a>
                <a href={`${pdfHref}?mode=separated`} className={LINK_CLASS}>
                  <Files className="h-4 w-4 shrink-0" aria-hidden="true" />
                  PDF - Con saltos de línea
                </a>
                {showExcel && excelHref ? (
                  <a href={excelHref} className={LINK_CLASS}>
                    <FileSpreadsheet className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Excel
                  </a>
                ) : null}
              </>
            ) : (
              <div className="flex gap-2">
                <a href={pdfHref} className={LINK_CLASS}>
                  <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
                  PDF
                </a>
                {showExcel && excelHref ? (
                  <a href={excelHref} className={LINK_CLASS}>
                    <FileSpreadsheet className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Excel
                  </a>
                ) : null}
              </div>
            )}
          </div>

          {secondary ? (
            <div className="flex flex-col gap-2">
              <Eyebrow>{secondary.label}</Eyebrow>
              {secondary.disabled ? (
                <DisabledReportLink message={secondary.disabledMessage} />
              ) : (
                <div className="flex gap-2">
                  <a href={secondary.pdfHref} className={LINK_CLASS}>
                    <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
                    PDF
                  </a>
                  {showExcel && secondary.excelHref ? (
                    <a href={secondary.excelHref} className={LINK_CLASS}>
                      <FileSpreadsheet className="h-4 w-4 shrink-0" aria-hidden="true" />
                      Excel
                    </a>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </Sheet>
    </>
  );
}
