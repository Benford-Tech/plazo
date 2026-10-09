import { describe, expect, it } from "vitest";
import { bookingFormValues } from "../forms";
import type { PublicBooking } from "../types";

const booking: PublicBooking = {
  reference: "R7KQ2M",
  status: "cancelled",
  paymentMode: "online",
  parking: { title: "Parking Démo LYS", slug: "parking-demo-lys", airport: { slug: "lyon-saint-exupery", name: "Lyon" }, address: null, shuttleMinutes: 8, openingHours: null },
  arrivalAt: "2026-10-03T08:00",
  returnAt: "2026-10-10T18:00",
  days: 8,
  priceCents: 5500,
  customerName: "Marie Claire Dupont",
  customerFirstName: "Marie Claire",
  customerLastName: "Dupont",
  customerEmail: "marie@example.com",
  customerPhone: "06 12 34 56 78",
  plate: "AB-123-CD",
  customerNote: "Siège bébé",
  vehicle: { model: "Peugeot 308", colour: "grise" },
  returnFlight: "TO 3627",
  departureFlight: "AF 7641",
  car: null,
  outbound: null,
  passengers: 3,
  cancellationPolicy: "free_24h",
  cancellableUntil: "2026-10-02T08:00",
  canCancel: false,
  canEditFlight: true,
};

describe("booking form refilled from a booking (« Modifier » on the payment step)", () => {
  it("gives back everything the traveller typed, the first and the last name apart", () => {
    expect(bookingFormValues(booking)).toEqual({
      customerFirstName: "Marie Claire",
      customerLastName: "Dupont",
      customerPhone: "06 12 34 56 78",
      customerEmail: "marie@example.com",
      plate: "AB-123-CD",
      returnFlight: "TO 3627",
      departureFlight: "AF 7641",
      passengers: "3",
      vehicleModel: "Peugeot 308",
      vehicleColour: "grise",
      customerNote: "Siège bébé",
      acceptTerms: "on",
    });
  });

  it("splits the full name of a booking from an older API (first word, then the rest)", () => {
    const older = { ...booking, customerFirstName: undefined, customerLastName: undefined, customerNote: undefined, vehicle: undefined, departureFlight: null };
    expect(bookingFormValues(older)).toMatchObject({
      customerFirstName: "Marie",
      customerLastName: "Claire Dupont",
      departureFlight: "",
      vehicleModel: "",
      vehicleColour: "",
      customerNote: "",
    });
    expect(bookingFormValues({ ...booking, customerFirstName: "", customerLastName: "" })).toMatchObject({ customerFirstName: "Marie", customerLastName: "Claire Dupont" });
  });

  it("keeps a missing last name empty, for the traveller to type", () => {
    expect(bookingFormValues({ ...booking, customerName: "Camille", customerFirstName: "Camille", customerLastName: "" })).toMatchObject({
      customerFirstName: "Camille",
      customerLastName: "",
    });
  });
});
