import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TopicGuideView, guidePartners } from "../TopicGuideView";
import type { TopicFacts } from "@/lib/airport-guides";
import { topicGuide } from "@/lib/guides";
import type { AirportResponse, SearchResult } from "@/lib/types";

const airport = { code: "LYS", name: "Lyon Saint-Exupéry", city: "Lyon", slug: "lyon-saint-exupery", timezone: "Europe/Paris" };
const NONE: TopicFacts = { week: null, shuttle: null, twoWeeks: null, valet: null };
const stay = { arrivee: "2026-10-10T08:00", retour: "2026-10-17T18:00" };

type Listing = AirportResponse["listings"][number];
const listing = (over: Partial<Listing>): Listing => ({
  slug: "parkair",
  title: "Parkair",
  services: ["shuttle"],
  shuttleMinutes: 8,
  distanceKm: 4,
  openingHours: null,
  cancellationPolicy: "free_24h",
  photo: null,
  fromPriceCents: 1500,
  fromDays: 1,
  ...over,
});
const result = (over: Partial<SearchResult>): SearchResult => ({ ...listing({}), available: true, days: 8, priceCents: 5600, ...over });
const preview = (results: SearchResult[]) => ({ airport, results });

describe("TopicGuideView (09/10/2026)", () => {
  const guide = topicGuide("lyon-saint-exupery", "parking-voiturier", NONE)!;
  const path = "/lyon-saint-exupery/guide/parking-voiturier";

  it("titles the page, links back to the airport and lists the sections", () => {
    const { container } = render(<TopicGuideView airport={airport} guide={guide} path={path} stay={stay} preview={null} listings={[]} />);
    expect(screen.getByRole("heading", { level: 1, name: guide.title })).toBeInTheDocument();
    const crumbs = screen.getByRole("navigation", { name: "Fil d’Ariane" });
    expect(within(crumbs).getByRole("link", { name: "Lyon Saint-Exupéry" })).toHaveAttribute("href", "/");
    expect(screen.getByText("Mis à jour le 9 octobre 2026")).toBeInTheDocument();
    const toc = screen.getByRole("navigation", { name: "Sur cette page" });
    expect(within(toc).getAllByRole("link")).toHaveLength(guide.sections.length);
    for (const section of guide.sections) expect(screen.getByRole("heading", { level: 2, name: section.title })).toHaveAttribute("id", section.id);
    // No partner online: the page says so, without any figure.
    expect(screen.getByText(guide.partners.empty)).toBeInTheDocument();
    const others = screen.getByRole("navigation", { name: "Les autres guides" });
    expect(within(others).getAllByRole("link").map(a => a.getAttribute("href"))).toEqual([
      "/lyon-saint-exupery/guide/parking-pas-cher",
      "/lyon-saint-exupery/guide/parking-longue-duree",
      "/#guide",
    ]);
    const ld = [...container.querySelectorAll('script[type="application/ld+json"]')].map(s => JSON.parse(s.textContent!));
    const types = ld.flat().map((d: { "@type": string }) => d["@type"]);
    expect(types).toEqual(expect.arrayContaining(["BreadcrumbList", "Article", "FAQPage"]));
    const faq = ld.flat().find((d: { "@type": string }) => d["@type"] === "FAQPage");
    expect(faq.mainEntity).toHaveLength(guide.faq.length);
  });

  it("shows only the real partners the page is about, cheapest first, priced for its stay", () => {
    const listings = [listing({ slug: "v1", title: "Valet Un", services: ["shuttle", "valet"] }), listing({ slug: "v2", title: "Valet Deux", services: ["valet"] }), listing({ slug: "self", title: "Sans voiturier" }), listing({ slug: "demo", title: "Démo", services: ["valet"], isDemo: true })];
    const data = preview([
      result({ slug: "v1", title: "Valet Un", services: ["shuttle", "valet"], priceCents: 9000 }),
      result({ slug: "v2", title: "Valet Deux", services: ["valet"], priceCents: 7000 }),
      result({ slug: "self", title: "Sans voiturier", priceCents: 4000 }),
      result({ slug: "demo", title: "Démo", services: ["valet"], isDemo: true, priceCents: 1000 }),
    ]);
    expect(guidePartners(guide, data, listings).map(r => r.slug)).toEqual(["v2", "v1"]);
    render(<TopicGuideView airport={airport} guide={guide} path={path} stay={stay} preview={data} listings={listings} />);
    expect(screen.queryByText(guide.partners.empty)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Valet Deux" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sans voiturier" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Démo" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Voir tous les parkings pour ces dates/ })).toHaveAttribute("href", "/lyon-saint-exupery/recherche?arrivee=2026-10-10T08:00&retour=2026-10-17T18:00");
  });
});
