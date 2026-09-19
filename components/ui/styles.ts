// Clases compartidas del rediseño movil. Las alturas (54 input, 52-54 boton)
// y los radios (14 input, 15 boton) salen de la guia de diseño.

export const inputClass =
  "h-[54px] w-full rounded-[14px] border border-line-input bg-surface px-4 text-base text-ink placeholder:text-ink-ph focus:border-[1.5px] focus:border-ink focus:outline-none";

export const inputMonoClass = `${inputClass} font-mono font-medium`;

export const inputErrorClass = "border-[1.5px] border-err-line focus:border-err-line";

export const labelClass = "text-[13px] font-semibold text-ink-label";

export const hintClass = "text-[12px] text-ink-3";

export const btnPrimary =
  "flex h-[54px] w-full items-center justify-center gap-2 rounded-[15px] bg-accent text-[17px] font-semibold text-white transition-colors duration-150 ease-out active:bg-accent-press disabled:cursor-not-allowed disabled:bg-disabled-bg disabled:text-disabled-ink";

export const btnSecondary =
  "flex h-[52px] w-full items-center justify-center gap-2 rounded-[15px] border border-line-input bg-surface text-base font-semibold text-ink transition-colors duration-150 ease-out active:bg-muted disabled:cursor-not-allowed disabled:text-disabled-ink";

export const btnSecondaryStrong =
  "flex h-[52px] w-full items-center justify-center gap-2 rounded-[15px] border border-ink bg-surface text-base font-semibold text-ink transition-colors duration-150 ease-out active:bg-muted";

export const btnIcon =
  "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line-input bg-surface text-ink-label transition-colors duration-150 ease-out active:bg-muted";

export const btnIconLarge =
  "flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[15px] border border-line-input bg-surface text-ink-label transition-colors duration-150 ease-out active:bg-muted";

export const cardClass = "rounded-[18px] border border-line bg-surface";

export const rowCardClass =
  "rounded-2xl border border-line bg-surface transition-colors duration-150 ease-out active:bg-muted";

export const eyebrowClass =
  "font-mono text-[12px] font-medium uppercase tracking-[0.1em] text-ink-3";

export const linkActionClass = "text-[13px] font-semibold text-link";
