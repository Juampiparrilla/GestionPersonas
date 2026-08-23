import { LogoutButton } from "@/components/LogoutButton";
import { getSessionContext } from "@/lib/session";

export default async function DirigenteHome() {
  const session = await getSessionContext();

  return (
    <div className="flex flex-1 flex-col gap-6 bg-zinc-50 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">
          Bienvenido, {session?.fullName}
        </h1>
        <LogoutButton />
      </div>
      <p className="text-zinc-600">Panel del dirigente — en construcción.</p>
    </div>
  );
}
