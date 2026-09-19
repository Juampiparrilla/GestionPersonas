// Iniciales generadas del nombre (dos letras), nunca imagenes. En los
// nombres "APELLIDO, NOMBRE" toma la inicial del apellido y la del nombre.
export function initialsOf(fullName: string): string {
  const cleaned = fullName.replace(/,/g, " ").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0][0] ?? "";
  const second = words.length > 1 ? (words[1][0] ?? "") : (words[0][1] ?? "");
  return `${first}${second}`.toUpperCase();
}

const SIZES = {
  sm: "h-9 w-9 rounded-[11px] text-[13px]",
  md: "h-10 w-10 rounded-xl text-sm",
  lg: "h-[52px] w-[52px] rounded-2xl text-lg",
} as const;

export function Avatar({
  name,
  size = "md",
  tone = "dark",
}: {
  name: string;
  size?: keyof typeof SIZES;
  tone?: "dark" | "muted";
}) {
  const toneClass = tone === "dark" ? "bg-ink text-app" : "bg-muted text-ink-label";
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center font-semibold ${SIZES[size]} ${toneClass}`}
    >
      {initialsOf(name)}
    </span>
  );
}
