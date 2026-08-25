import { ArrowLeft, Car, UsersRound } from "lucide-react";
import Link from "next/link";

export default function SuperadminReportesPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 bg-zinc-50 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Reportes</h1>
        <Link
          href="/superadmin"
          className="flex items-center gap-1 text-sm text-zinc-600 underline underline-offset-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/superadmin/punteros"
          className="flex h-14 items-center justify-center gap-2 rounded-xl bg-zinc-900 text-base font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          <UsersRound className="h-5 w-5" aria-hidden="true" />
          Punteros
        </Link>
        <Link
          href="/superadmin/personas"
          className="flex h-14 items-center justify-center gap-2 rounded-xl bg-zinc-900 text-base font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          <UsersRound className="h-5 w-5" aria-hidden="true" />
          Personas
        </Link>
        <Link
          href="/superadmin/vehiculos"
          className="flex h-14 items-center justify-center gap-2 rounded-xl bg-zinc-900 text-base font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          <Car className="h-5 w-5" aria-hidden="true" />
          Vehículos
        </Link>
      </div>
    </div>
  );
}
