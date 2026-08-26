import { ClipboardList } from "lucide-react";
import Link from "next/link";

import { LogoutButton } from "@/components/LogoutButton";
import { OrganizationsClient } from "@/features/organizations/OrganizationsClient";
import { listOrganizations } from "@/features/organizations/queries";
import { roleLabel } from "@/lib/roles";
import { getSessionContext } from "@/lib/session";

export default async function PlataformaHome() {
  const session = await getSessionContext();
  const organizations = await listOrganizations();

  return (
    <div className="flex flex-1 flex-col gap-6 bg-zinc-50 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Bienvenido, {session?.fullName}</h1>
          <p className="text-sm text-zinc-500">{roleLabel(session!.role)}</p>
        </div>
        <LogoutButton />
      </div>

      <Link
        href="/plataforma/auditoria"
        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-zinc-900 text-base font-semibold text-white transition-colors hover:bg-zinc-800"
      >
        <ClipboardList className="h-5 w-5" aria-hidden="true" />
        Auditoría
      </Link>

      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Organizaciones</h2>
        <p className="text-sm text-zinc-600">
          Creá y administrá las organizaciones de la plataforma y sus administradores.
        </p>
      </div>

      <OrganizationsClient organizations={organizations} />
    </div>
  );
}
