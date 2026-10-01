import { beforeEach, describe, expect, it, vi } from "vitest";

const { createBooking, lookupBooking, redirect, cookieJar, changeFlight, cancelBooking } = vi.hoisted(() => ({
  createBooking: vi.fn(),
  lookupBooking: vi.fn(),
  changeFlight: vi.fn(),
  cancelBooking: vi.fn(),
  cookieJar: new Map<string, { value: string; options: Record<string, unknown> }>(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT ${url}`);
  }),
}));
vi.mock("../api", async () => {
  const actual = await vi.importActual<typeof import("../api")>("../api");
  return { ApiError: actual.ApiError, api: { createBooking, lookupBooking, changeFlight, cancelBooking } };
});
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)!.value } : undefined),
    set: (name: string, value: string, options: Record<string, unknown>) => cookieJar.set(name, { value, options }),
  }),
}));
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirect(url) }));
vi.mock("next/cache", () => ({ refresh: vi.fn() }));

import { bookAction, cancelAction, changeFlightAction, lookupAction } from "../actions";
import { ApiError } from "../api";
import { EMPTY_FORM } from "../forms";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  return data;
}

const filled = {
  airport: "lyon-saint-exupery",
  parking: "parking-demo-lys",
  arrivalAt: "2026-10-04T06:30",
  returnAt: "2026-10-11T15:05",
  customerName: " Camille Laurent ",
  customerPhone: "06 12 34 56 78",
  customerEmail: "camille@example.com",
  plate: "gk318px",
  returnFlight: "",
  passengers: "2",
  acceptTerms: "on",
  price: "1", // a tampered field: never forwarded
};

describe("bookAction", () => {
  beforeEach(() => {
    createBooking.mockReset();
    redirect.mockClear();
    cookieJar.clear();
  });

  it("forwards the traveller's fields (no price) and opens the booking page, with the key in a cookie only", async () => {
    const manageToken = "tok_0123456789abcdefghij";
    createBooking.mockResolvedValue({ reference: "RAB234", manageToken, booking: {} });
    await expect(bookAction(EMPTY_FORM, form({ ...filled, idempotencyKey: "6f1c2a9e-3b7d-4e8f-9a0b-1c2d3e4f5a6b" }))).rejects.toThrow(
      "REDIRECT /ma-reservation/RAB234?confirmee=1",
    );
    expect(cookieJar.get("cle-RAB234")).toEqual({
      value: manageToken,
      options: expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/ma-reservation/RAB234" }),
    });
    expect(createBooking).toHaveBeenCalledWith({
      airport: "lyon-saint-exupery",
      parking: "parking-demo-lys",
      arrivalAt: "2026-10-04T06:30",
      returnAt: "2026-10-11T15:05",
      customerName: "Camille Laurent",
      customerPhone: "06 12 34 56 78",
      customerEmail: "camille@example.com",
      plate: "GK-318-PX",
      returnFlight: undefined,
      passengers: 2,
      acceptTerms: true,
      idempotencyKey: "6f1c2a9e-3b7d-4e8f-9a0b-1c2d3e4f5a6b",
    });
  });

  it("drops a malformed idempotency key", async () => {
    createBooking.mockResolvedValue({ reference: "RAB234", manageToken: "tok_0123456789abcdefghij", booking: {} });
    await bookAction(EMPTY_FORM, form({ ...filled, idempotencyKey: "x" })).catch(() => null);
    expect(createBooking.mock.calls[0][0].idempotencyKey).toBeUndefined();
  });

  it("returns the API's field errors with the typed values", async () => {
    createBooking.mockRejectedValue(new ApiError(400, "x", "validation_failed", { acceptTerms: "terms_required" }));
    const state = await bookAction(EMPTY_FORM, form({ ...filled, acceptTerms: "" }));
    expect(createBooking.mock.calls[0][0].acceptTerms).toBe(false);
    expect(state).toMatchObject({ error: "validation_failed", fields: { acceptTerms: "terms_required" }, values: { customerName: "Camille Laurent", plate: "GK-318-PX" } });
  });

  it("keeps the full nights of an overbooking", async () => {
    createBooking.mockRejectedValue(new ApiError(409, "Full", "overbooked", undefined, { fullNights: ["2026-10-04"] }));
    const state = await bookAction(EMPTY_FORM, form(filled));
    expect(state).toMatchObject({ error: "overbooked", fullNights: ["2026-10-04"] });
  });
});

describe("lookupAction", () => {
  it("answers the same way for a wrong reference or a wrong email", async () => {
    lookupBooking.mockRejectedValue(new ApiError(404, "Booking not found", "not_found"));
    const state = await lookupAction(EMPTY_FORM, form({ reference: "rab234", email: "x@example.com" }));
    expect(lookupBooking).toHaveBeenCalledWith("RAB234", "x@example.com");
    expect(state.error).toBe("lookup_not_found");
  });

  it("keeps the key in a cookie and opens the booking without it in the address", async () => {
    cookieJar.clear();
    lookupBooking.mockResolvedValue({ reference: "RAB234", manageToken: "tok_0123456789abcdefghij" });
    await expect(lookupAction(EMPTY_FORM, form({ reference: "rab234", email: "x@example.com" }))).rejects.toThrow("REDIRECT /ma-reservation/RAB234");
    expect(redirect).toHaveBeenLastCalledWith("/ma-reservation/RAB234");
    expect(cookieJar.get("cle-RAB234")?.value).toBe("tok_0123456789abcdefghij");
  });
});

describe("booking management actions", () => {
  beforeEach(() => {
    cookieJar.clear();
    changeFlight.mockReset();
    cancelBooking.mockReset();
  });

  it("send the key kept in this browser's cookie", async () => {
    cookieJar.set("cle-RAB234", { value: "tok_0123456789abcdefghij", options: {} });
    changeFlight.mockResolvedValue({ returnFlight: "TO 3627" });
    cancelBooking.mockResolvedValue({});
    const flight = new FormData();
    flight.set("returnFlight", "to3627");
    expect(await changeFlightAction("RAB234", EMPTY_FORM, flight)).toMatchObject({ notice: "flight_saved" });
    expect(changeFlight).toHaveBeenCalledWith("RAB234", "tok_0123456789abcdefghij", "to3627");
    await expect(cancelAction("RAB234", EMPTY_FORM)).rejects.toThrow("REDIRECT /ma-reservation/RAB234?annulee=1");
    expect(cancelBooking).toHaveBeenCalledWith("RAB234", "tok_0123456789abcdefghij");
  });
});
