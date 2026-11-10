import type { InboundEmail, ParsedBooking } from "@/lib/types";

/** A booking change Plazo could not apply because its booking is closed: a new booking is typed from it instead. */
export function canCreateFromChange(email: InboundEmail): boolean {
  const change = email.change;
  return (
    !!change &&
    !change.applied &&
    change.kind !== "cancellation" &&
    change.reason === "reservation_closed" &&
    !email.reservationId &&
    (email.status === "incomplete" || email.status === "unrecognised" || email.status === "handled")
  );
}

/** The mail's booking, the new values of its change on top (what the comparator says the booking now is). */
export function prefillOf(email: InboundEmail): ParsedBooking {
  const booking: ParsedBooking = { ...(email.parsed ?? { provider: email.provider ?? "" }) };
  const set = booking as unknown as Record<string, unknown>;
  for (const c of email.change?.changes ?? []) {
    if (c.to === null || c.to === "" || c.field === "status") continue;
    set[c.field] = c.to;
  }
  if (!booking.provider) booking.provider = email.provider ?? "";
  return booking;
}

