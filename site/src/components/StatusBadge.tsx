import { fr } from "@/lib/fr";
import type { BookingStatus } from "@/lib/types";

/** Boutique soft pills: sage = confirmed, amber = in progress or waiting, rose = cancelled / no-show, cream = over. */
const TONES: Record<BookingStatus, string> = {
  pending_payment: "pill-warn",
  upcoming: "pill-ok",
  arrived: "pill-warn",
  shuttled_out: "pill-warn",
  return_requested: "pill-warn",
  back_at_parking: "pill-warn",
  returned: "",
  cancelled: "pill-danger",
  no_show: "pill-danger",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return <span className={`pill ${TONES[status] ?? ""}`.trim()}>{fr.status[status] ?? status}</span>;
}
