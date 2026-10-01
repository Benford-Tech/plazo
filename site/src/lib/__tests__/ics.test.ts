import { describe, expect, it } from "vitest";
import { bookingIcs, escapeText, foldLine } from "../ics";
import type { PublicBooking } from "../types";

const booking: PublicBooking = {
  reference: "RAB234",
  status: "upcoming",
  paymentMode: "on_site",
  parking: {
    title: "Parking Démo LYS",
    slug: "parking-demo-lys",
    airport: { slug: "lyon-saint-exupery", name: "Lyon Saint-Exupéry" },
    address: "Route de l'aéroport, 69125 Colombier-Saugnieu",
    shuttleMinutes: 8,
    openingHours: null,
  },
  arrivalAt: "2026-10-04T06:30",
  returnAt: "2026-10-11T15:05",
  days: 8,
  priceCents: 5500,
  customerName: "Camille Laurent",
  customerEmail: "camille@example.com",
  customerPhone: "0612345678",
  plate: "GK-318-PX",
  returnFlight: "TO 3627",
  passengers: 2,
  cancellationPolicy: "free_24h",
  cancellableUntil: "2026-10-03T06:30",
  canCancel: true,
  canEditFlight: true,
};

describe("calendar file", () => {
  it("has the drop-off and the return in UTC, without personal data", () => {
    const ics = bookingIcs(booking, { siteUrl: "https://plazo.example", now: new Date("2026-10-01T10:00:00Z") });
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("DTSTART:20261004T043000Z");
    expect(ics).toContain("DTSTART:20261011T130500Z");
    expect(ics).toContain("UID:RAB234-depot@plazo.example");
    expect(ics).toContain("LOCATION:Route de l'aéroport\\, 69125 Colombier-Saugnieu");
    expect(ics).not.toContain("Camille");
    expect(ics).not.toContain("GK-318-PX");
    expect(ics.split("\r\n").every(line => new TextEncoder().encode(line).length <= 75)).toBe(true);
  });

  it("escapes and folds text", () => {
    expect(escapeText("a,b;c\\d\ne")).toBe("a\\,b\\;c\\\\d\\ne");
    const folded = foldLine(`DESCRIPTION:${"é".repeat(60)}`);
    expect(folded.split("\r\n ").length).toBeGreaterThan(1);
    expect(folded.replace(/\r\n /g, "")).toBe(`DESCRIPTION:${"é".repeat(60)}`);
  });
});
