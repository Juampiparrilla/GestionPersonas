"use client";

import { Info, X } from "lucide-react";
import { useState } from "react";

import { ROLE_HELP } from "@/lib/roleHelp";
import type { UserRole } from "@/types/domain";

export function RoleHelpButton({ role }: { role: UserRole }) {
  const [open, setOpen] = useState(false);
  const help = ROLE_HELP[role];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Qué puedo hacer con mi cuenta"
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
      >
        <Info className="h-5 w-5" aria-hidden="true" />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
            className="flex w-full max-w-sm flex-col gap-3 rounded-xl bg-white p-5 shadow-lg"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-zinc-900">{help.title}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <ul className="flex flex-col gap-2 text-sm text-zinc-700">
              {help.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-zinc-400">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
