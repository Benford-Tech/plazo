import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResultCard } from "../ResultCard";
import { pinsOf } from "../HomeMap";
import type { SearchResult } from "@/lib/types";

const result = (over: Partial<SearchResult> = {}): SearchResult => ({
  slug: "rhone",
  title: "Parking du Rhône",
  services: ["shuttle"],
  shuttleMinutes: 5,
  distanceKm: 3.5,
  openingHours: null,
  cancellationPolicy: "free_24h",
  photo: null,
  location: { lat: 45.73, lng: 5.05 },
  payment: "online",
  available: true,
  days: 6,
  priceCents: 5400,
  ...over,
});

describe("« EN DIRECT » dans les résultats (R-B + I-C)", () => {
  it("pastille sur la photo des parkings qui montrent leurs navettes, et rien sur les autres", () => {
    const { rerender } = render(<ResultCard result={result({ liveShuttle: true })} href="/lyon/rhone" highlighted={false} />);
    const pill = screen.getByTestId("live-shuttle");
    expect(pill).toHaveTextContent("En direct");
    expect(pill).toHaveAttribute("title", "Navette suivie en direct : vous la verrez arriver dans votre réservation.");
    rerender(<ResultCard result={result({ liveShuttle: false })} href="/lyon/rhone" highlighted={false} />);
    expect(screen.queryByTestId("live-shuttle")).not.toBeInTheDocument();
    rerender(<ResultCard result={result()} href="/lyon/rhone" highlighted={false} />);
    expect(screen.queryByTestId("live-shuttle")).not.toBeInTheDocument();
  });

  it("la pastille est posée sur la photo, pas parmi les badges", () => {
    render(<ResultCard result={result({ liveShuttle: true })} href="/lyon/rhone" highlighted badges={["cheapest"]} />);
    const pill = screen.getByTestId("live-shuttle");
    expect(pill.parentElement).toContainElement(screen.getByRole("img", { name: "Photos du parking à venir" }));
    expect(pill.closest("ul")).toBeNull();
    expect(screen.getByText("Le moins cher")).toHaveAttribute("data-badge", "cheapest");
  });

  it("le minibus suit le parking jusqu’à son étiquette sur la carte", () => {
    expect(pinsOf([result({ liveShuttle: true }), result({ slug: "pistes", liveShuttle: false })]).map(p => [p.slug, p.live])).toEqual([
      ["rhone", true],
      ["pistes", false],
    ]);
  });
});

describe("carte de résultat Boutique", () => {
  it("un parking complet reste lisible : pastille « Complet à ces dates », sans lien ni carte estompée", () => {
    render(<ResultCard result={result({ available: false })} href="/lyon/rhone" highlighted={false} />);
    const card = screen.getByRole("article", { name: "Parking du Rhône" });
    expect(card).toHaveTextContent("Complet à ces dates");
    expect(card).toHaveTextContent("Essayez d’autres dates");
    expect(card.className).not.toMatch(/opacity/);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("sans photo, un visuel « Photos du parking à venir » ; « Le moins cher » en pastille", () => {
    render(<ResultCard result={result()} href="/lyon/rhone" highlighted badges={["cheapest", "fastestShuttle"]} />);
    expect(screen.getByRole("img", { name: "Photos du parking à venir" })).toBeInTheDocument();
    expect(screen.getByText("Le moins cher")).toHaveAttribute("data-badge", "cheapest");
    expect(screen.getByText("Navette la plus rapide")).toHaveAttribute("data-badge", "fastestShuttle");
    expect(screen.getByRole("link", { name: /^Voir et réserver/ })).toHaveAttribute("href", "/lyon/rhone");
  });

  it("frais de nuit (direction B, 12/10/2026) : le total seul, sans pastille ni détail ; la carte aussi", () => {
    const night = result({ priceCents: 6900, basePriceCents: 5400, nightFee: { arrivalCents: 1500, returnCents: 0, totalCents: 1500 } });
    render(<ResultCard result={night} href="/lyon/rhone" highlighted={false} />);
    const card = screen.getByRole("article", { name: "Parking du Rhône" });
    expect(card).toHaveTextContent("69,00 €");
    expect(card).toHaveTextContent("6 jours, tout compris");
    expect(card).not.toHaveTextContent(/nuit|15,00/);
    expect(pinsOf([night])[0].label).toBe("69\u00a0€");
  });
});
