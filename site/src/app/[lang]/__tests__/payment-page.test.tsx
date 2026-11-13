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
    expect(screen.getByRole("button", { name: /^Payer 55,00\s€$/ })).toBeInTheDocument();
    expect(screen.getByText("Vous allez être redirigé vers la page de paiement sécurisée Stripe.")).toBeInTheDocument();
  });

  it("child seats (24/10/2026): « N passagers · … » in the recap when some are asked, nothing otherwise", async () => {
    booking.mockResolvedValue({ ...held, passengers: 3, childSeats: { infant: 1, toddler: 0, booster: 1 } });
    await renderPage();
    expect(screen.getByText("3 passagers · 1 siège bébé · 1 réhausseur")).toBeInTheDocument();
    booking.mockResolvedValue({ ...held, childSeats: { infant: 0, toddler: 0, booster: 0 } });
    document.body.innerHTML = "";
    await renderPage();
    expect(screen.queryByText(/passager/)).not.toBeInTheDocument();
  });

  it("shows both booked hours, and no detail lines without a night fee", async () => {
    booking.mockResolvedValue(held);
    await renderPage();
    expect(screen.getByText("08:00", { selector: ".font-hour" })).toBeInTheDocument();
    expect(screen.getByText("18:00", { selector: ".font-hour" })).toBeInTheDocument();
    expect(screen.queryByText(/Forfait/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Frais de nuit/)).not.toBeInTheDocument();
    expect(screen.getByText("Total").nextElementSibling).toHaveTextContent("55,00 €");
  });

  it("night fee (direction B): the package, « Frais de nuit · dépôt à 23:30 » and the total, read from the booking", async () => {
    booking.mockResolvedValue({
      ...held,
      arrivalAt: "2026-10-03T23:30",
      priceCents: 5500,
      basePriceCents: 4000,
      nightFee: { arrivalCents: 1500, returnCents: 0, totalCents: 1500 },
    });
    await renderPage();
    // The drop-off tile and the fee line both show the hour.
    expect(screen.getAllByText("23:30", { selector: ".font-hour" })).toHaveLength(2);
    expect(screen.getByText("Forfait 8 jours").nextElementSibling).toHaveTextContent("40,00 €");
    const feeTerm = screen.getByText((_, el) => el?.tagName === "DT" && el.textContent === "Frais de nuit · dépôt à 23:30");
    expect(feeTerm.nextElementSibling).toHaveTextContent("15,00 €");
    expect(screen.getByText("Total").nextElementSibling).toHaveTextContent("55,00 €");
    expect(screen.getByRole("button", { name: /^Payer 55,00\s€$/ })).toBeInTheDocument();
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
