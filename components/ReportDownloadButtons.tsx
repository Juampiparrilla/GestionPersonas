import { FileSpreadsheet, FileText } from "lucide-react";

export function ReportDownloadButtons({ pdfHref, excelHref }: { pdfHref: string; excelHref: string }) {
  return (
    <div className="flex gap-2">
      <a
        href={pdfHref}
        className="flex h-10 items-center gap-1.5 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
      >
        <FileText className="h-4 w-4" aria-hidden="true" />
        PDF
      </a>
      <a
        href={excelHref}
        className="flex h-10 items-center gap-1.5 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
      >
        <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
        Excel
      </a>
    </div>
  );
}
