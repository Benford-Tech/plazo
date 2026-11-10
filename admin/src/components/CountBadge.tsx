import { fr } from "@/lib/fr";
import { cn } from "@/lib/utils";

/** The amber counter of the menu (mails to check, services to do). */
export function CountBadge({ n, className }: { n: number | null | undefined; className?: string }) {
  if (!n) return null;
  return (
    <span
      aria-label={fr.nav.toDo(n)}
      className={cn(
        "ml-auto min-w-[22px] rounded-full bg-[#FEF3C7] px-1.5 text-center font-mono text-[11px] font-semibold leading-5 text-[#B45309]",
        className,
      )}
    >
      {n}
    </span>
  );
}
