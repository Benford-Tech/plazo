import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PublicBooking } from "@/lib/types";

const { booking, redirect } = vi.hoisted(() => ({
  booking: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT ${url}`);
  }),
}));
vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return { ApiError: actual.ApiError, api: { booking, returnState: vi.fn() } };
});
vi.mock("@/lib/manage-session", () => ({ manageTokenFor: async () => "k".repeat(32) }));
vi.mock("@/lib/actions", () => ({ cancelAction: vi.fn(), changeFlightAction: vi.fn(), lookupAction: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirect(url), useRouter: () => ({ refresh: vi.fn() }) }));

import ManageBookingPage from "../ma-reservation/[reference]/page";

// A closed stay: no live block of the day (they poll the API), only the recap.
const returned: PublicBooking = {
  reference: "R7KQ2M",
  status: "returned",
  paymentMode: "online",
  payment: { status: "paid", holdExpiresAt: null, holdSecondsLeft: null },
  parking: { title: "Parking Démo LYS", slug: "parking-demo-lys", airport: { slug: "lyon-saint-exupery", name: "Lyon" }, address: null, shuttleMinutes: 8, openingHours: null },
  arrivalAt: "2026-10-03T23:30",
  returnAt: "2026-10-10T18:00",
  days: 8,
  priceCents: 5160,
  basePriceCents: 3660,
  nightFee: { arrivalCents: 1500, returnCents: 0, totalCents: 1500 },
  customerName: "Camille Martin",
  customerFirstName: "Camille",
  customerLastName: "Martin",
  customerEmail: "camille@example.com",
  customerPhone: "06 12 34 56 78",
  plate: "AB-123-CD",
  returnFlight: null,
  departureFlight: null,
  car: null,
  outbound: null,
  passengers: 1,
  cancellationPolicy: "free_24h",
  cancellableUntil: null,
  canCancel: false,
  canEditFlight: false,
};

async function renderPage() {
  const ui = await ManageBookingPage({ params: Promise.resolve({ reference: "R7KQ2M" }), searchParams: Promise.resolve({}) } as never);
  return render(ui);
}

describe("Ma réservation: night fees (direction B, 12/10/2026)", () => {
  beforeEach(() => {
    booking.mockReset();
    redirect.mockClear();
  });

  it("says how much of the amount paid was night fees, from the booking's snapshot", async () => {
    booking.mockResolvedValue(returned);
    await renderPage();
    expect(screen.getByText("Payé").nextElementSibling).toHaveTextContent("51,60 €");
    expect(screen.getByText(/^dont 15,00\s€ de frais de nuit$/)).toBeInTheDocument();
  });

  it("refunded: the refunded amount keeps the line", async () => {
    booking.mockResolvedValue({ ...returned, status: "cancelled", payment: { status: "refunded", holdExpiresAt: null, holdSecondsLeft: null } });
    await renderPage();
    expect(screen.getByText("Remboursé")).toBeInTheDocument();
    expect(screen.getByText(/^dont 15,00\s€ de frais de nuit$/)).toBeInTheDocument();
  });

  it("no night fee (or an older API): the amount alone", async () => {
    booking.mockResolvedValue({ ...returned, priceCents: 3660, basePriceCents: undefined, nightFee: undefined });
    await renderPage();
    expect(screen.getByText("Payé").nextElementSibling).toHaveTextContent("36,60 €");
    expect(screen.queryByText(/frais de nuit/)).not.toBeInTheDocument();
  });
});
