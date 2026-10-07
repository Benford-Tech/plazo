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

  it("le minibus suit le parking jusqu’à son étiquette sur la carte", () => {
    expect(pinsOf([result({ liveShuttle: true }), result({ slug: "pistes", liveShuttle: false })]).map(p => [p.slug, p.live])).toEqual([
      ["rhone", true],
      ["pistes", false],
    ]);
  });
});
