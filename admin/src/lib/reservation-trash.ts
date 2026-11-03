import type { Reservation } from "./types";

const ON_SITE = ["arrived", "shuttled_out", "return_requested", "back_at_parking"];

/** 03/11/2026: whether the server would take the deletion (never paid on Plazo, never a car at the parking). */
export function deletable(r: Pick<Reservation, "channel" | "status">): boolean {
  return r.channel !== "plazo" && (r.status as string) !== "pending_payment" && !ON_SITE.includes(r.status);
}
