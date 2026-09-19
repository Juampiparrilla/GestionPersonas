import { PointerCard } from "./PointerCard";
import type { PointerListItem } from "./queries";

export function PointersList({
  pointers,
  empty,
}: {
  pointers: PointerListItem[];
  empty: React.ReactNode;
}) {
  if (pointers.length === 0) {
    return <>{empty}</>;
  }

  return (
    <div className="flex flex-col gap-[9px]">
      {pointers.map((pointer) => (
        <PointerCard key={pointer.id} pointer={pointer} />
      ))}
    </div>
  );
}
