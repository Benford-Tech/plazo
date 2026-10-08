import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AirportGuide } from "../AirportGuide";
import { airportGuide } from "@/lib/airport-guides";

describe("AirportGuide (C-A)", () => {
  const guide = airportGuide("lyon-saint-exupery", { week: null, shuttle: { min: 6, max: 12 } })!;

  it("titles the guide and each of its sections, and links each one from « Sur cette page »", () => {
    render(<AirportGuide guide={guide} />);
    expect(screen.getByRole("heading", { level: 2, name: "Se garer à l’aéroport de Lyon Saint-Exupéry" })).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Sur cette page" });
    const links = within(nav).getAllByRole("link");
    expect(links).toHaveLength(guide.sections.length);
    for (const [i, section] of guide.sections.entries()) {
      expect(links[i]).toHaveAttribute("href", `#${section.id}`);
      expect(screen.getByRole("heading", { level: 3, name: section.title })).toHaveAttribute("id", section.id);
    }
  });

  it("shows the comparison as a real table, and the tips as a list", () => {
    render(<AirportGuide guide={guide} />);
    const table = screen.getByRole("table", { name: "Aéroport ou parking privé : l’essentiel" });
    expect(within(table).getByRole("columnheader", { name: "Parkings privés partenaires" })).toBeInTheDocument();
    const shuttleRow = within(table).getByRole("row", { name: /Accès aux terminaux/ });
    expect(within(shuttleRow).getByRole("rowheader")).toHaveTextContent("Accès aux terminaux");
    expect(shuttleRow).toHaveTextContent("Navette gratuite, 6 à 12 min");
    expect(screen.getByRole("list")).toHaveTextContent("Réservez dès que vos dates sont connues.");
  });
});
