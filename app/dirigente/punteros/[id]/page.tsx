import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReportDownloadButtons } from "@/components/ReportDownloadButtons";
import { PeopleClient } from "@/features/people/PeopleClient";
import { listPeopleForPointer } from "@/features/people/queries";
import { getPointerBasics } from "@/features/pointers/queries";
import { getLeaderWriteStatus } from "@/lib/leader-write-status";
import { getSessionContext } from "@/lib/session";

export default async function PointerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSessionContext();
  const pointer = await getPointerBasics(id);

  if (!pointer || pointer.leaderId !== session?.leaderId) {
    notFound();
  }

  const [people, writeStatus] = await Promise.all([
    listPeopleForPointer(id),
    getLeaderWriteStatus(session.organizationId, session.leaderId!),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 bg-zinc-50 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">{pointer.fullName}</h1>
          <p className="text-sm text-zinc-600">
            DNI {pointer.dni} · {people.length} personas
          </p>
        </div>
        <Link
          href="/dirigente/punteros"
          className="flex items-center gap-1 text-sm text-zinc-600 underline underline-offset-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver
        </Link>
      </div>

      <ReportDownloadButtons
        pdfHref={`/api/reportes/mis-personas/pdf?pointerId=${id}`}
        excelHref={`/api/reportes/mis-personas/excel?pointerId=${id}`}
      />

      <PeopleClient people={people} pointerId={id} canWrite={writeStatus.canWrite} />
    </div>
  );
}
