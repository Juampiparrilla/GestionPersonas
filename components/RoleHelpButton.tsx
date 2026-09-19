"use client";

import { Info } from "lucide-react";
import { useCallback, useState } from "react";

import { Sheet } from "@/components/ui/Sheet";
import { btnIcon } from "@/components/ui/styles";
import { ROLE_HELP } from "@/lib/roleHelp";
import type { UserRole } from "@/types/domain";

export function RoleHelpButton({ role }: { role: UserRole }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const help = ROLE_HELP[role];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Qué puedo hacer con mi cuenta"
        className={btnIcon}
      >
        <Info className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
      </button>

      <Sheet open={open} onClose={close} title={help.title}>
        <ul className="flex flex-col gap-3 pb-8 text-[15px] text-ink-label">
          {help.items.map((item) => (
            <li key={item} className="flex gap-2.5">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-ph" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}
