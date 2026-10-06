import { fr } from "@/lib/fr";
import type { BookingStatus } from "@/lib/types";

const TONES: Record<BookingStatus, string> = {
  pending_payment: "bg-tint text-accent-dark",
  upcoming: "bg-ok-bg text-ok",
  arrived: "bg-tint text-accent-dark",
  shuttled_out: "bg-tint text-accent-dark",
  return_requested: "bg-tint text-accent-dark",
  back_at_parking: "bg-tint text-accent-dark",
  returned: "bg-tint text-soft",
  cancelled: "bg-danger-bg text-danger",
  no_show: "bg-danger-bg text-danger",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return <span className={`rounded-xl px-2.5 py-1 text-[13px] font-bold whitespace-nowrap ${TONES[status] ?? "bg-tint text-soft"}`}>{fr.status[status] ?? status}</span>;
}
