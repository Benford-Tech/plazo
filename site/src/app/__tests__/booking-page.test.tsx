import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ParkingResponse } from "@/lib/types";

const { parking } = vi.hoisted(() => ({ parking: vi.fn() }));
vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return { ApiError: actual.ApiError, api: { parking } };
});
vi.mock("@/lib/actions", () => ({ bookAction: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}));

import BookingPage from "../[airport]/[parking]/reserver/page";

const data = (over: Partial<ParkingResponse["parking"]["pricing"]> = {}, offer: ParkingResponse["offer"] = null): ParkingResponse => ({
  payments: "online",
  airport: { code: "LYS", name: "Lyon Saint-Exupéry", slug: "lyon-saint-exupery", location: null },
  parking: {
    slug: "parkair",
    title: "Parkair Lyon",
    services: ["shuttle"],
    shuttleMinutes: 8,
    distanceKm: 3,
    openingHours: null,
    cancellationPolicy: "free_24h",
    photo: null,
    payment: "online",
    description: null,
    photos: [],
    address: null,
    pricing: { tiers: [{ days: 1, priceCents: 1500 }], extraDayPriceCents: 500, night: null, ...over },
  },
  offer,
});

async function renderPage(arrivee: string, retour: string) {
  const ui = await BookingPage({
    params: Promise.resolve({ airport: "lyon-saint-exupery", parking: "parkair" }),
    searchParams: Promise.resolve({ arrivee, retour }),
  } as never);
  return render(ui);
}

const terms = () => Array.from(document.querySelectorAll("aside dt")).map(dt => dt.textContent);

describe("booking recap: night fees (direction B, 12/10/2026)", () => {
  beforeEach(() => parking.mockReset());

  it("the package, « Frais de nuit · dépôt à 23:30 », the service fee and the total, then the parking's rule", async () => {
    parking.mockResolvedValue(
      data(
        { night: { start: "22:00", end: "06:00", arrivalFeeCents: 1500, returnFeeCents: 1500 } },
        { available: true, days: 8, priceCents: 5160, basePriceCents: 3660, nightFee: { arrivalCents: 1500, returnCents: 0, totalCents: 1500 } },
      ),
    );
    await renderPage("2099-10-13T23:30", "2099-10-20T18:00");
    expect(terms()).toEqual(["Dépôt", "Retour", "Forfait 8 jours", "Frais de nuit · dépôt à 23:30", "Frais de service", "Total"]);
    expect(screen.getByText("Forfait 8 jours").nextElementSibling).toHaveTextContent("36,60 €");
    expect(screen.getByText("Total").nextElementSibling).toHaveTextContent("51,60 €");
    expect(screen.getByText(/^Ce parking ajoute 15\s€ pour un dépôt ou un retour entre 22:00 et 06:00\.$/)).toBeInTheDocument();
    // The form's note gives the same total as the recap.
    expect(screen.getByText(/Paiement sécurisé par carte à l’étape suivante/)).toHaveTextContent("51,60 €");
  });

  it("both ends at night: one line naming both hours, the fees added up", async () => {
    parking.mockResolvedValue(
      data(
        { night: { start: "22:00", end: "06:00", arrivalFeeCents: 1500, returnFeeCents: 1000 } },
        { available: true, days: 8, priceCents: 6160, basePriceCents: 3660, nightFee: { arrivalCents: 1500, returnCents: 1000, totalCents: 2500 } },
      ),
    );
    await renderPage("2099-10-13T22:30", "2099-10-20T05:30");
    const fee = screen.getByText((_, el) => el?.tagName === "DT" && el.textContent === "Frais de nuit · dépôt à 22:30 et retour à 05:30");
    expect(fee.nextElementSibling).toHaveTextContent("25,00 €");
    expect(screen.getByText(/^Ce parking ajoute 15\s€ pour un dépôt et 10\s€ pour un retour entre 22:00 et 06:00\.$/)).toBeInTheDocument();
  });

  it("no night rule: the lines as before, no sentence", async () => {
    parking.mockResolvedValue(data({}, { available: true, days: 8, priceCents: 3660, basePriceCents: 3660, nightFee: null }));
    await renderPage("2099-10-13T08:00", "2099-10-20T18:00");
    expect(terms()).toEqual(["Dépôt", "Retour", "Forfait 8 jours", "Frais de service", "Total"]);
    expect(screen.queryByText(/Ce parking ajoute/)).not.toBeInTheDocument();
  });
});
