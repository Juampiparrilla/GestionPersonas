import { EmptyState } from "@/components/ui/EmptyState";
import { LogoutRow } from "@/components/ui/MenuList";
import { Screen } from "@/components/ui/Screen";
import { getSessionContext } from "@/lib/session";

// Rol "Reports": todavia sin pantallas propias.
export default async function ReportesHome() {
  const session = await getSessionContext();

  return (
    <Screen title={session?.fullName ?? "Reportes"}>
      <EmptyState variant="blank" title="Panel de reportes">
        Todavía está en construcción.
      </EmptyState>
      <LogoutRow />
    </Screen>
  );
}
