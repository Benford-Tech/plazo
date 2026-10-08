import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatEuros } from "../money";
import { parkingMetaDescription } from "../seo";
import { breadcrumbLd, faqLd, jsonLdScript, organizationLd, parkingListLd, parkingLd, websiteLd } from "../structured-data";
import type { AirportResponse, ParkingResponse } from "../types";

const BASE = "https://www.plazo.test";
const airport = { code: "LYS", name: "Lyon Saint-Exupéry", city: "Lyon", slug: "lyon-saint-exupery", timezone: "Europe/Paris" };

const listing = (over: Partial<AirportResponse["listings"][number]>): AirportResponse["listings"][number] => ({
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

const parking = (over: Partial<ParkingResponse["parking"]> = {}): Pick<ParkingResponse, "airport" | "parking"> => ({
  airport,
  parking: {
    ...listing({}),
    description: "Parking clos à Colombier-Saugnieu, navette gratuite vers les terminaux.",
    photos: ["/photos/a.jpg", "https://cdn.example.com/b.jpg"],
    address: "12 route de Lyon, 69124 Colombier-Saugnieu",
    phone: "+33 4 00 00 00 00",
    location: { lat: 45.72, lng: 5.08 },
    services: ["shuttle", "open_24h", "fenced"],
    pricing: { tiers: [{ days: 8, priceCents: 4500 }, { days: 1, priceCents: 1500 }], extraDayPriceCents: 500 },
    ...over,
  },
});

describe("structured data (schema.org)", () => {
  it("describes the publisher and the site on the home page", () => {
    expect(organizationLd(BASE)).toMatchObject({ "@type": "Organization", "@id": `${BASE}/#organization`, url: `${BASE}/`, logo: `${BASE}/apple-icon.png` });
    expect(websiteLd(BASE)).toMatchObject({ "@type": "WebSite", url: `${BASE}/`, inLanguage: "fr-FR", publisher: { "@id": `${BASE}/#organization` } });
  });

  it("restates the questions shown on the page", () => {
    expect(faqLd([])).toBeNull();
    expect(faqLd([["Puis-je annuler ?", "Oui."]])).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [{ "@type": "Question", name: "Puis-je annuler ?", acceptedAnswer: { "@type": "Answer", text: "Oui." } }],
    });
  });

  it("lists the real partner parkings only: a demo parking is never described", () => {
    const list = parkingListLd(BASE, { airport, listings: [listing({ slug: "demo", title: "Démo", isDemo: true }), listing({})] });
    expect(list).toMatchObject({
      "@type": "ItemList",
      itemListElement: [{ "@type": "ListItem", position: 1, url: `${BASE}/lyon-saint-exupery/parkair`, name: "Parkair" }],
    });
    expect(parkingListLd(BASE, { airport, listings: [listing({ isDemo: true })] })).toBeNull();
  });

  it("describes a parking: place, contact, services and lowest price; nothing for a demo parking", () => {
    const data = parkingLd(BASE, parking(), "Texte");
    expect(data).toMatchObject({
      "@type": ["ParkingFacility", "LocalBusiness"],
      "@id": `${BASE}/lyon-saint-exupery/parkair#parking`,
      name: "Parkair",
      url: `${BASE}/lyon-saint-exupery/parkair`,
      description: "Texte",
      image: [`${BASE}/photos/a.jpg`, "https://cdn.example.com/b.jpg"],
      address: "12 route de Lyon, 69124 Colombier-Saugnieu",
      geo: { "@type": "GeoCoordinates", latitude: 45.72, longitude: 5.08 },
      telephone: "+33 4 00 00 00 00",
      openingHours: "Mo-Su 00:00-23:59",
      priceRange: `dès ${formatEuros(1500)} la journée`,
    });
    expect((data?.amenityFeature as { name: string }[]).map(f => f.name)).toHaveLength(3);
    // Outside the airport: never presented as a part of it.
    expect(data).not.toHaveProperty("containedInPlace");

    const bare = parkingLd(BASE, parking({ photos: [], address: null, phone: null, location: null, services: [], pricing: { tiers: [], extraDayPriceCents: null } }), "Texte");
    expect(Object.keys(bare ?? {})).toEqual(["@context", "@type", "@id", "name", "url", "description"]);
    expect(parkingLd(BASE, parking({ isDemo: true }), "Texte")).toBeNull();
  });

  it("gives the breadcrumb absolute addresses", () => {
    expect(breadcrumbLd(BASE, [{ name: "Lyon Saint-Exupéry", path: "/" }, { name: "Parkair", path: "/lyon-saint-exupery/parkair" }])).toMatchObject({
      itemListElement: [
        { position: 1, name: "Lyon Saint-Exupéry", item: `${BASE}/` },
        { position: 2, name: "Parkair", item: `${BASE}/lyon-saint-exupery/parkair` },
      ],
    });
  });

  it("cannot close its script early", () => {
    const script = jsonLdScript({ name: "</script><script>alert(1)</script>" });
    expect(script).not.toContain("</script>");
    expect(JSON.parse(script)).toEqual({ name: "</script><script>alert(1)</script>" });
  });
});

describe("meta description of a parking page", () => {
  it("keeps a short text, cuts a long one at a word, and falls back to a sentence", () => {
    expect(parkingMetaDescription(parking())).toBe("Parking clos à Colombier-Saugnieu, navette gratuite vers les terminaux.");
    const long = parkingMetaDescription(parking({ description: `${"Navette gratuite toutes les dix minutes, ".repeat(6)}fin.` }));
    expect(long.length).toBeLessThanOrEqual(160);
    expect(long).toBe(`${"Navette gratuite toutes les dix minutes, ".repeat(3)}Navette gratuite toutes les dix…`);
    expect(parkingMetaDescription(parking({ description: "  " }))).toContain("Parkair, parking avec navette pour l’aéroport de Lyon Saint-Exupéry");
  });
});

describe("sitemap", () => {
  const airportMock = vi.fn();
  beforeEach(() => {
    vi.resetModules();
    vi.doMock("@/lib/api", () => ({ api: { airport: airportMock } }));
    vi.stubEnv("PUBLIC_SITE_URL", BASE);
  });
  afterEach(() => {
    vi.doUnmock("@/lib/api");
    vi.unstubAllEnvs();
  });

  it("lists the home page and the real parkings, never the demo ones", async () => {
    airportMock.mockResolvedValue({ airport, listings: [listing({ slug: "demo", isDemo: true }), listing({})] });
    const { default: sitemap } = await import("@/app/sitemap");
    expect((await sitemap()).map(entry => entry.url)).toEqual([`${BASE}/`, `${BASE}/lyon-saint-exupery/parkair`]);
  });

  it("still serves the home page when the API does not answer", async () => {
    airportMock.mockRejectedValue(new Error("down"));
    const { default: sitemap } = await import("@/app/sitemap");
    expect((await sitemap()).map(entry => entry.url)).toEqual([`${BASE}/`]);
  });
});
