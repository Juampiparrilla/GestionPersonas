import { LogOut } from "lucide-react";

import { logout } from "@/lib/auth-actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        title="Cerrar sesión"
        aria-label="Cerrar sesión"
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-300 text-zinc-600 hover:bg-red-50 hover:text-red-600"
      >
        <LogOut className="h-5 w-5" aria-hidden="true" />
      </button>
    </form>
  );
}
