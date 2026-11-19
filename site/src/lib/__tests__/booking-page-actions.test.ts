import { beforeEach, describe, expect, it, vi } from "vitest";

// Site du parking, niveau 3 (19/11/2026): the actions of a parking's own booking page. Fictional data only.

const { bookingPage, parking, createBooking, checkout } = vi.hoisted(() => ({
  bookingPage: vi.fn(),
  parking: vi.fn(),
  createBooking: vi.fn(),
  checkout: vi.fn(),
}));
vi.mock("../api", async () => {
  const actual = await vi.importActual<typeof import("../api")>("../api");
  return { ApiError: actual.ApiError, api: { bookingPage, parking, createBooking, checkout } };
});
const requestHeaders = new Headers();
vi.mock("next/headers", () => ({ headers: async () => requestHeaders, cookies: async () => ({ get: () => undefined, set: vi.fn() }) }));

import { ApiError } from "../api";
import { bookOnBookingPage, quoteOnBookingPage } from "../booking-page-actions";

const PAGE = { slug: "cedres", title: "Parking des Cèdres", airport: "lyon-saint-exupery", airportName: "Lyon", parking: "cedres", accent: "#0E4C6E", accentInk: "#FFFFFF" };
const TOKEN = "t".repeat(32);

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  return data;
}

describe("page de réservation du parking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bookingPage.mockResolvedValue(PAGE);
  });

  it("le prix vient de la fiche du parking de la page", async () => {
    parking.mockResolvedValue({ offer: { available: true, days: 8, priceCents: 6300 } });
    const res = await quoteOnBookingPage("cedres", "2026-11-21T06:30", "2026-11-28T21:40");
    expect(parking).toHaveBeenCalledWith("lyon-saint-exupery", "cedres", "2026-11-21T06:30", "2026-11-28T21:40");
    expect(res).toEqual({ offer: { available: true, days: 8, priceCents: 6300 }, error: null });
  });

  it("une date refusée donne le message de son champ", async () => {
    parking.mockRejectedValue(new ApiError(400, "Invalid", "validation_failed", { arrivalAt: "arrival_in_past" }));
    expect(await quoteOnBookingPage("cedres", "2020-01-01T06:30", "2020-01-02T06:30")).toEqual({ offer: null, error: "arrival_in_past" });
  });

  it("réserve avec la page, puis donne la page de paiement de Stripe, sans poser de cookie", async () => {
    createBooking.mockResolvedValue({ reference: "R7KQ2M", manageToken: TOKEN, booking: { status: "pending_payment" } });
    checkout.mockResolvedValue({ url: "https://checkout.stripe.test/c/pay/cs_1" });
    const res = await bookOnBookingPage(
      "cedres",
      { values: {}, fields: {}, error: null },
      form({ arrivalAt: "2026-11-21T06:30", returnAt: "2026-11-28T21:40", customerFirstName: "Camille", customerLastName: "Exemple", customerPhone: "06 12 34 56 78", customerEmail: "camille@exemple.example", plate: "ab123cd", passengers: "2", acceptTerms: "on" }),
    );
    expect(createBooking).toHaveBeenCalledWith(expect.objectContaining({ airport: "lyon-saint-exupery", parking: "cedres", bookingPage: "cedres", plate: "AB-123-CD", passengers: 2, acceptTerms: true }));
    expect(checkout).toHaveBeenCalledWith("R7KQ2M", TOKEN);
    expect(res).toMatchObject({ error: null, reference: "R7KQ2M", payUrl: "https://checkout.stripe.test/c/pay/cs_1" });
  });

  it("garde les erreurs par champ", async () => {
    createBooking.mockRejectedValue(new ApiError(400, "Invalid", "validation_failed", { customerPhone: "required" }));
    const res = await bookOnBookingPage("cedres", { values: {}, fields: {}, error: null }, form({ customerFirstName: "Camille" }));
    expect(res).toMatchObject({ error: "validation_failed", fields: { customerPhone: "required" }, values: { customerFirstName: "Camille" } });
    expect(checkout).not.toHaveBeenCalled();
  });
});
