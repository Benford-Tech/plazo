import { fr } from "@/lib/fr";
import type { ReservationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Direction A (05/11/2026, « Sur place et attendu ne sont pas assez visibles »): a booking's status as a solid pill,
 * one colour per status: amber waiting, green at the parking, indigo with the shuttle, grey done, red cancelled.
 */
const STATUS_PILL: Record<string, string> = {
  pending_payment: "bg-[#6B7280]",
  upcoming: "bg-[#B45309]",
  arrived: "bg-[#15803D]",
  shuttled_out: "bg-info",
  return_requested: "bg-[#B45309]",
  back_at_parking: "bg-[#15803D]",
  returned: "bg-[#6B7280]",
  cancelled: "bg-bad",
  no_show: "bg-bad",
};

export function StatusPill({ status, size = "md", className }: { status: ReservationStatus | string; size?: "md" | "lg"; className?: string }) {
  return (
    <span
      data-testid={`status-pill-${status}`}
      className={cn(
        "inline-flex w-fit shrink-0 items-center whitespace-nowrap rounded-full font-extrabold text-white",
        size === "lg" ? "px-3.5 py-1 text-base" : "px-2.5 py-0.5 text-[13px]",
        STATUS_PILL[status] ?? "bg-[#6B7280]",
        className,
      )}
    >
      {fr.status[status as ReservationStatus] ?? status}
    </span>
  );
}
