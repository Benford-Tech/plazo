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
});
