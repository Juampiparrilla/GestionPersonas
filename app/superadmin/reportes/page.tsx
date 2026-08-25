import Link from "next/link";

export default function SuperadminReportesPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 bg-zinc-50 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Reportes</h1>
        <Link href="/superadmin" className="text-sm text-zinc-600 underline underline-offset-2">
          Volver
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/superadmin/punteros"
          className="flex h-14 items-center justify-center rounded-xl bg-zinc-900 text-base font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          👤 Punteros
        </Link>
        <Link
          href="/superadmin/personas"
          className="flex h-14 items-center justify-center rounded-xl bg-zinc-900 text-base font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          👤 Personas
        </Link>
        <Link
          href="/superadmin/vehiculos"
          className="flex h-14 items-center justify-center rounded-xl bg-zinc-900 text-base font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          🚗 Vehículos
        </Link>
      </div>
    </div>
  );
}
