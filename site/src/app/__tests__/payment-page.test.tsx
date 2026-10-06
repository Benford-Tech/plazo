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
  return { ApiError: actual.ApiError, api: { booking } };
});
vi.mock("@/lib/manage-session", () => ({ manageTokenFor: async () => "k".repeat(32) }));
vi.mock("@/lib/actions", () => ({ payAction: vi.fn(), editBookingAction: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirect(url), useRouter: () => ({ refresh: vi.fn() }) }));

import PaymentPage from "../ma-reservation/[reference]/paiement/page";

const held: PublicBooking = {
  reference: "R7KQ2M",
  status: "pending_payment",
  paymentMode: "online",
  payment: { status: "pending", holdExpiresAt: "2026-10-02T12:30:00.000Z", holdSecondsLeft: 1785 },
  parking: { title: "Parking Démo LYS", slug: "parking-demo-lys", airport: { slug: "lyon-saint-exupery", name: "Lyon" }, address: null, shuttleMinutes: 8, openingHours: null },
  arrivalAt: "2026-10-03T08:00",
  returnAt: "2026-10-10T18:00",
  days: 8,
  priceCents: 5500,
  customerName: "Camille Martin",
  customerEmail: "camille@example.com",
  customerPhone: "06 12 34 56 78",
  plate: "AB-123-CD",
  returnFlight: null,
  departureFlight: null,
  car: null,
  outbound: null,
  passengers: 1,
  cancellationPolicy: "free_24h",
  cancellableUntil: "2026-10-02T08:00",
  canCancel: false,
  canEditFlight: true,
};

async function renderPage() {
  const ui = await PaymentPage({ params: Promise.resolve({ reference: "R7KQ2M" }), searchParams: Promise.resolve({}) } as never);
  return render(ui);
}

describe("payment step (step 2)", () => {
  beforeEach(() => {
    booking.mockReset();
    redirect.mockClear();
  });

  it("shows the recap, the time left on the hold and « Payer »", async () => {
    booking.mockResolvedValue(held);
    await renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "Paiement" })).toBeInTheDocument();
    expect(screen.getByText("2 · Paiement").closest("li")).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("Parking Démo LYS")).toBeInTheDocument();
    expect(screen.getByText("8 jours")).toBeInTheDocument();
    expect(screen.getByText("AB-123-CD")).toBeInTheDocument();
    expect(screen.getByText("Camille Martin")).toBeInTheDocument();
    expect(screen.getByText("06 12 34 56 78")).toBeInTheDocument();
    expect(screen.getByText("55,00 €")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Modifier" })).toBeInTheDocument();
    // Server-rendered time left: readable without JavaScript.
    expect(screen.getByText(/Votre place est réservée pendant/)).toHaveTextContent("Votre place est réservée pendant 29:45");
    expect(screen.getByRole("button", { name: /^Payer 55,00\s€ ›$/ })).toBeInTheDocument();
    expect(screen.getByText("Vous allez être redirigé vers la page de paiement sécurisée Stripe.")).toBeInTheDocument();
  });

  it("once the hold is over: « Le délai est dépassé » and a button to start again", async () => {
    booking.mockResolvedValue({ ...held, status: "cancelled", payment: { status: "expired", holdExpiresAt: null, holdSecondsLeft: null } });
    await renderPage();
    expect(screen.getByRole("heading", { name: "Le délai est dépassé" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Recommencer la réservation" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Payer/ })).not.toBeInTheDocument();
  });

  it("paid, or paid at the parking: the booking's own page", async () => {
    booking.mockResolvedValue({ ...held, status: "upcoming", payment: { status: "paid", holdExpiresAt: null, holdSecondsLeft: null } });
    await expect(renderPage()).rejects.toThrow("REDIRECT /ma-reservation/R7KQ2M");
    booking.mockResolvedValue({ ...held, status: "upcoming", paymentMode: "on_site", payment: null });
    await expect(renderPage()).rejects.toThrow("REDIRECT /ma-reservation/R7KQ2M");
  });
});
