import { eyebrowClass } from "./styles";

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className={eyebrowClass}>{children}</p>;
}
