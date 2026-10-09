import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AirportGuide } from "../AirportGuide";
import { airportGuide } from "@/lib/airport-guides";

describe("AirportGuide (C-A)", () => {
  const guide = airportGuide("lyon-saint-exupery", { week: null, shuttle: { min: 6, max: 12 } })!;

  it("titles the guide and each of its sections, and links each one from « Sur cette page »", () => {
    render(<AirportGuide guide={guide} />);
    expect(screen.getByRole("heading", { level: 2, name: guide.title })).toBeInTheDocument();
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
    expect(screen.getAllByRole("list").at(-1)).toHaveTextContent("Gardez la confirmation à portée de main");
  });

  it("renders a wide table with one cell per column, its source under it, and the sub-headings of a section", () => {
    render(<AirportGuide guide={guide} />);
    const official = guide.sections.find(s => s.id === "parkings-officiels")!;
    const table = screen.getByRole("table", { name: official.table!.caption });
    expect(within(table).getAllByRole("columnheader")).toHaveLength(official.table!.columns.length);
    const p5 = within(table).getByRole("row", { name: /^P5/ });
    expect(within(p5).getAllByRole("cell")).toHaveLength(official.table!.columns.length);
    expect(p5).toHaveTextContent("Navette gratuite toutes les 7 min (10 min la nuit)");
    expect(screen.getAllByText(/Chiffres relevés le 9 octobre 2026/).length).toBeGreaterThanOrEqual(2);
    for (const part of official.parts!) expect(screen.getByRole("heading", { level: 4, name: part.title })).toBeInTheDocument();
  });

  it("links three of its sections to the topic guides", () => {
    render(<AirportGuide guide={guide} />);
    for (const href of ["/lyon-saint-exupery/guide/parking-pas-cher", "/lyon-saint-exupery/guide/parking-longue-duree", "/lyon-saint-exupery/guide/parking-voiturier"]) {
      expect(screen.getAllByRole("link").some(a => a.getAttribute("href") === href)).toBe(true);
    }
  });
});
