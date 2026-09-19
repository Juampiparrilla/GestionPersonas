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
  const [session, pointer] = await Promise.all([getSessionContext(), getPointerBasics(id)]);

  if (!pointer || pointer.leaderId !== session?.leaderId) {
    notFound();
  }

  const [people, writeStatus] = await Promise.all([
    listPeopleForPointer(id),
    getLeaderWriteStatus(session.organizationId!, session.leaderId!),
  ]);

  return (
    <PeopleClient
      people={people}
      pointer={{
        id,
        fullName: pointer.fullName,
        dni: pointer.dni,
        phone: pointer.phone,
        address: pointer.address,
      }}
      canWrite={writeStatus.canWrite}
      exportSlot={
        <ReportDownloadButtons
          pdfHref={`/api/reportes/mis-personas/pdf?pointerId=${id}`}
          showExcel={false}
          disabled={people.length === 0}
          disabledMessage="Todavía no hay personas registradas en este puntero."
        />
      }
    />
  );
}
