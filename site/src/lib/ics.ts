import { toInstant } from "./dates";
import { texts } from "./fr";
import { formatEuros } from "./money";
import { PRODUCT_NAME } from "./product";
import type { PublicBooking } from "./types";

/** iCalendar (RFC 5545) file with the drop-off and the return of a booking. */

function utcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/** Escapes TEXT values: backslash, semicolon, comma and newlines. */
export function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Folds a content line at 75 octets (continuation lines start with a space). */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const out: string[] = [];
  let current = "";
  for (const char of line) {
    const limit = out.length === 0 ? 75 : 74;
    if (encoder.encode(current + char).length > limit) {
      out.push(current);
      current = char;
    } else {
      current += char;
    }
  }
  out.push(current);
  return out.join("\r\n ");
}

export function bookingIcs(booking: PublicBooking, options: { siteUrl: string; now?: Date }): string {
  const now = options.now ?? new Date();
  const host = new URL(options.siteUrl).host || "localhost";
  const manageUrl = `${options.siteUrl}/ma-reservation`;
  const t = texts(booking.paymentMode === "online");
  const description = t.calendar.description(booking.reference, booking.priceCents === null ? null : formatEuros(booking.priceCents), manageUrl);
  const event = (id: string, local: string, summary: string) => {
    const start = toInstant(local);
    if (!start) return [];
    return [
      "BEGIN:VEVENT",
      `UID:${booking.reference}-${id}@${host}`,
      `DTSTAMP:${utcStamp(now)}`,
      `DTSTART:${utcStamp(start)}`,
      "DURATION:PT30M",
      `SUMMARY:${escapeText(summary)}`,
      ...(booking.parking.address ? [`LOCATION:${escapeText(booking.parking.address)}`] : []),
      `DESCRIPTION:${escapeText(description)}`,
      "END:VEVENT",
    ];
  };
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${escapeText(PRODUCT_NAME)}//Reservation//FR`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...event("depot", booking.arrivalAt, t.calendar.dropOff(booking.parking.title)),
    ...event("retour", booking.returnAt, t.calendar.pickUp(booking.parking.title)),
    "END:VCALENDAR",
  ];
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}
