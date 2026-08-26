import { Settings } from "lucide-react";
import Link from "next/link";

export function AccountSettingsLink() {
  return (
    <Link
      href="/mi-cuenta"
      aria-label="Mi cuenta"
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
    >
      <Settings className="h-5 w-5" aria-hidden="true" />
    </Link>
  );
}
