"use client";

import { ChevronDown, FileSpreadsheet, FileText, Files, X } from "lucide-react";
import { useState } from "react";

const SECTION_LABEL_CLASS = "text-xs font-medium uppercase tracking-wide text-zinc-500";
const LINK_CLASS =
  "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100";

export function ReportDownloadButtons({
  pdfHref,
  excelHref,
  showPdfModes = false,
  primaryLabel,
  secondary,
}: {
  pdfHref: string;
  excelHref: string;
  showPdfModes?: boolean;
  primaryLabel?: string;
  secondary?: { label: string; pdfHref: string; excelHref: string };
}) {
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 text-left"
      >
        <p className="flex items-center gap-2 font-medium text-zinc-900">
          <FileText className="h-5 w-5 text-zinc-500" aria-hidden="true" />
          Generar reporte
        </p>
        <ChevronDown className="h-5 w-5 text-zinc-400" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div className="rounded-xl border-2 border-zinc-300 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-medium text-zinc-900">
          <FileText className="h-5 w-5 text-zinc-500" aria-hidden="true" />
          Generar reporte
        </p>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          aria-label="Cerrar"
          className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          {primaryLabel ? <p className={SECTION_LABEL_CLASS}>{primaryLabel}</p> : null}
          {showPdfModes ? (
            <>
              <a href={`${pdfHref}?mode=combined`} className={LINK_CLASS}>
                <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
                PDF - Sin saltos de línea
              </a>
              <a href={`${pdfHref}?mode=separated`} className={LINK_CLASS}>
                <Files className="h-4 w-4 shrink-0" aria-hidden="true" />
                PDF - Con saltos de línea
              </a>
              <a href={excelHref} className={LINK_CLASS}>
                <FileSpreadsheet className="h-4 w-4 shrink-0" aria-hidden="true" />
                Excel
              </a>
            </>
          ) : (
            <div className="flex gap-2">
              <a href={pdfHref} className={LINK_CLASS}>
                <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
                PDF
              </a>
              <a href={excelHref} className={LINK_CLASS}>
                <FileSpreadsheet className="h-4 w-4 shrink-0" aria-hidden="true" />
                Excel
              </a>
            </div>
          )}
        </div>

        {secondary ? (
          <div className="flex flex-col gap-2">
            <p className={SECTION_LABEL_CLASS}>{secondary.label}</p>
            <div className="flex gap-2">
              <a href={secondary.pdfHref} className={LINK_CLASS}>
                <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
                PDF
              </a>
              <a href={secondary.excelHref} className={LINK_CLASS}>
                <FileSpreadsheet className="h-4 w-4 shrink-0" aria-hidden="true" />
                Excel
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
