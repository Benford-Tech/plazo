import { cn } from "@/lib/utils";

/** « Sièges auto » (24/10/2026): a child car seat seen from the side, drawn in the current text colour. */
export function ChildSeatIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <path d="M7 3.5 9.5 13" />
      <path d="M9.5 13h7.5a2 2 0 0 1 2 2v1a3 3 0 0 1-3 3H8.5a3 3 0 0 1-3-3v-1a2 2 0 0 1 2-2h2" />
      <path d="M12 13v-2.5a2 2 0 0 1 2-2h2" />
      <path d="M8.5 19v1.5M16 19v1.5" />
    </svg>
  );
}
