import { beforeEach, describe, expect, it, vi } from "vitest";

const { createBooking, checkout, releaseBooking, booking, redirect, cookieJar } = vi.hoisted(() => ({
  createBooking: vi.fn(),
  checkout: vi.fn(),
  releaseBooking: vi.fn(),
  booking: vi.fn(),
  cookieJar: new Map<string, { value: string; options: Record<string, unknown> }>(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT ${url}`);
  }),
}));
vi.mock("../api", async () => {
  const actual = await vi.importActual<typeof import("../api")>("../api");
  return { ApiError: actual.ApiError, api: { createBooking, checkout, releaseBooking, booking } };
});
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)!.value } : undefined),
    set: (name: string, value: string, options: Record<string, unknown>) => cookieJar.set(name, { value, options }),
  }),
}));
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirect(url) }));
vi.mock("next/cache", () => ({ refresh: vi.fn() }));

import { bookAction, editBookingAction, payAction } from "../actions";
import { ApiError } from "../api";
import { EMPTY_FORM } from "../forms";

const TOKEN = "t".repeat(32);

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  return data;
}

describe("online payment actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieJar.clear();
    cookieJar.set("cle-R7KQ2M", { value: TOKEN, options: {} });
  });

  it("a booking held for payment goes to the payment step", async () => {
    createBooking.mockResolvedValue({ reference: "R7KQ2M", manageToken: TOKEN, booking: { status: "pending_payment" } });
    await expect(bookAction(EMPTY_FORM, form({ customerFirstName: "Camille", customerLastName: "Martin", acceptTerms: "on" }))).rejects.toThrow("REDIRECT /ma-reservation/R7KQ2M/paiement");
  });

  it("« Payer » goes to Stripe's page", async () => {
    checkout.mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/cs_test_1" });
    await expect(payAction("R7KQ2M", EMPTY_FORM)).rejects.toThrow("REDIRECT https://checkout.stripe.com/c/pay/cs_test_1");
    expect(checkout).toHaveBeenCalledWith("R7KQ2M", TOKEN);
  });

  it("already paid: to the booking; hold over: back to the payment step; other errors: shown", async () => {
    checkout.mockResolvedValue({ paid: true });
    await expect(payAction("R7KQ2M", EMPTY_FORM)).rejects.toThrow("REDIRECT /ma-reservation/R7KQ2M?paiement=retour");
    checkout.mockRejectedValue(new ApiError(409, "x", "hold_expired"));
    await expect(payAction("R7KQ2M", EMPTY_FORM)).rejects.toThrow("REDIRECT /ma-reservation/R7KQ2M/paiement");
    checkout.mockRejectedValue(new ApiError(503, "x", "payments_unavailable"));
    expect(await payAction("R7KQ2M", EMPTY_FORM)).toMatchObject({ error: "payments_unavailable" });
  });

  it("« Modifier » releases the place and reopens the form, values kept through a cookie for that form only", async () => {
    releaseBooking.mockResolvedValue({});
    booking.mockResolvedValue({ parking: { slug: "parking-demo-lys", airport: { slug: "lyon-saint-exupery" } }, arrivalAt: "2026-10-03T08:00", returnAt: "2026-10-10T18:00" });
    await expect(editBookingAction("R7KQ2M", EMPTY_FORM)).rejects.toThrow(
      "REDIRECT /lyon-saint-exupery/parking-demo-lys/reserver?arrivee=2026-10-03T08:00&retour=2026-10-10T18:00&reprise=1",
    );
    expect(releaseBooking).toHaveBeenCalledWith("R7KQ2M", TOKEN);
    const cookie = cookieJar.get("reprise")!;
    expect(cookie.value).toBe(`R7KQ2M.${TOKEN}`);
    expect(cookie.options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/lyon-saint-exupery/parking-demo-lys/reserver", maxAge: 3600 });
  });

  it("« Modifier » after the payment went through: to the confirmed booking", async () => {
    releaseBooking.mockRejectedValue(new ApiError(409, "x", "already_paid"));
    await expect(editBookingAction("R7KQ2M", EMPTY_FORM)).rejects.toThrow("REDIRECT /ma-reservation/R7KQ2M?paiement=retour");
  });
});
