import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../StayFields", () => ({ StayFields: () => null }));

import { BookingCard } from "../BookingCard";

const props = {
  airportSlug: "lyon-saint-exupery",
  parkingSlug: "parking-demo-lys",
  stay: { arrivee: "2026-10-10T08:00", retour: "2026-10-14T18:00" },
  offer: { available: true, days: 5, priceCents: 4500 },
  fromPriceCents: 1500,
  fromDays: 1,
  policy: "free_24h" as const,
  minDate: "2026-10-02",
  errors: {},
};

describe("BookingCard", () => {
  it("without a payment mode: « bientôt disponible » (every booking is paid online)", () => {
    render(<BookingCard {...props} />);
    expect(screen.queryByText(/sur place/)).not.toBeInTheDocument();
    expect(screen.getByText("Réservation en ligne bientôt disponible")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Réserver" })).not.toBeInTheDocument();
  });

  it("paid online: the total is paid online", () => {
    render(<BookingCard {...props} payment="online" />);
    expect(screen.getByText("Total à payer en ligne")).toBeInTheDocument();
    expect(screen.queryByText(/sur place/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Réserver" })).toBeInTheDocument();
  });

  it("operator not ready for online payment: « bientôt disponible » instead of the button", () => {
    render(<BookingCard {...props} payment="unavailable" />);
    expect(screen.getByText("Réservation en ligne bientôt disponible")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Réserver" })).not.toBeInTheDocument();
    expect(screen.queryByText(/payer en ligne|sur place/)).not.toBeInTheDocument();
    // The price breakdown stays.
    expect(screen.getAllByText("45,00 €").length).toBeGreaterThan(0);
  });

  it("no night fee: « Forfait » is the total, no night fee line, no rule", () => {
    render(<BookingCard {...props} payment="online" />);
    expect(screen.getByText("Forfait 5 jours").nextElementSibling).toHaveTextContent("45,00 €");
    expect(screen.queryByText(/Frais de nuit/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Ce parking ajoute/)).not.toBeInTheDocument();
  });

  it("night fee (direction B): « Forfait » prints the grid price, the fee line names the hour, the total adds up", () => {
    const stay = { arrivee: "2026-10-13T23:30", retour: "2026-10-20T18:00" };
    const offer = { available: true, days: 8, priceCents: 5160, basePriceCents: 3660, nightFee: { arrivalCents: 1500, returnCents: 0, totalCents: 1500 } };
    const nightRule = { start: "22:00", end: "06:00", arrivalFeeCents: 1500, returnFeeCents: 1500 };
    render(<BookingCard {...props} stay={stay} offer={offer} payment="online" nightRule={nightRule} />);
    expect(screen.getByText("Forfait 8 jours").nextElementSibling).toHaveTextContent("36,60 €");
    const feeTerm = screen.getByText((_, el) => el?.tagName === "DT" && el.textContent === "Frais de nuit · dépôt à 23:30");
    expect(feeTerm.nextElementSibling).toHaveTextContent("15,00 €");
    expect(screen.getByText("23:30", { selector: ".font-hour" })).toBeInTheDocument();
    expect(screen.getByText("Total à payer en ligne").nextElementSibling).toHaveTextContent("51,60 €");
    // The fee line sits between the package and the total.
    const terms = Array.from(document.querySelectorAll("dt")).map(dt => dt.textContent);
    expect(terms).toEqual(["Forfait 8 jours", "Frais de nuit · dépôt à 23:30", "Frais de service", "Total à payer en ligne"]);
    expect(screen.getByText(/^Ce parking ajoute 15\s€ pour un dépôt ou un retour entre 22:00 et 06:00\.$/)).toBeInTheDocument();
  });

  it("states the parking's rule even when this stay pays no night fee", () => {
    render(<BookingCard {...props} payment="online" nightRule={{ start: "22:00", end: "06:00", arrivalFeeCents: 1500, returnFeeCents: 1000 }} />);
    expect(screen.queryByText(/Frais de nuit/)).not.toBeInTheDocument();
    expect(screen.getByText(/^Ce parking ajoute 15\s€ pour un dépôt et 10\s€ pour un retour entre 22:00 et 06:00\.$/)).toBeInTheDocument();
  });
});
