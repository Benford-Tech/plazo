import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ParkingResponse, ParkingSiteInfo, SiteBlock } from "@/lib/types";
import { ParkingSite } from "./ParkingSite";

// 22/11/2026 (« pouvoir créer un site dédié au parking », « le plus modulaire possible »). Fictional data only.

vi.mock("@/components/booking-page/BookingPageModule", () => ({
  BookingPageModule: ({ embedded }: { embedded?: boolean }) => <div data-testid="module">{embedded ? "embedded" : "page"}</div>,
}));

const data: ParkingResponse = {
  airport: { code: "LYS", name: "Lyon Saint-Exupéry", slug: "lyon-saint-exupery" },
  parking: {
    slug: "p",
    title: "Parking des Cèdres",
    services: ["shuttle"],
    shuttleMinutes: 8,
    distanceKm: 5,
    openingHours: null,
    cancellationPolicy: "free_24h",
    photo: null,
    payment: "online",
    description: "À huit minutes du Terminal 1.",
    photos: [],
    address: "12 rue des Cèdres, Colombier-Saugnieu",
    phone: "04 72 00 00 00",
    pricing: { tiers: [{ days: 8, priceCents: 6200 }, { days: 3, priceCents: 3400 }], extraDayPriceCents: 500 },
  },
  offer: null,
};

const block = (kind: string, over: Partial<SiteBlock> = {}): SiteBlock => ({ id: kind, kind, enabled: true, title: null, text: null, ...over });
const site = (blocks: SiteBlock[], over: Partial<ParkingSiteInfo> = {}): ParkingSiteInfo => ({
  slug: "cedres",
  title: "Parking des Cèdres",
  airport: "lyon-saint-exupery",
  airportName: "Lyon Saint-Exupéry",
  parking: "p",
  accent: "#0E5FA8",
  accentInk: "#FFFFFF",
  blocks,
  bookable: true,
  preview: false,
  ...over,
});

const headings = () => screen.getAllByRole("heading", { level: 2 }).map(h => h.textContent);

describe("le site du parking", () => {
  it("montre les blocs dans l’ordre du gérant, avec ses titres ; un genre inconnu est sauté", () => {
    render(
      <ParkingSite
        idempotencyKey="k"
        data={data}
        site={site([
          block("pricing", { title: "Nos tarifs" }),
          block("carrousel"),
          block("booking"),
          block("text", { id: "text-1", title: "Depuis 2014", text: "Une affaire de famille." }),
          block("contact"),
        ])}
      />,
    );
    expect(headings()).toEqual(["Nos tarifs", "Réserver", "Depuis 2014", "Nous contacter"]);
    expect(screen.getByTestId("module")).toHaveTextContent("embedded");
    expect(screen.getByText("34,00 €")).toBeInTheDocument();
    expect(screen.getByText("Une affaire de famille.")).toBeInTheDocument();
    // The menu follows the blocks; the button goes to the booking block.
    const menu = screen.getByRole("navigation", { name: "Parking des Cèdres" });
    expect(within(menu).getAllByRole("link").map(a => [a.textContent, a.getAttribute("href")])).toEqual([
      ["Nos tarifs", "#tarifs"],
      ["Nous contacter", "#contact"],
    ]);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("un bloc sans rien à dire ne s’affiche pas ; l’aperçu le dit et ne réserve pas", () => {
    render(<ParkingSite idempotencyKey="k" data={data} site={site([block("booking"), block("photos"), block("faq", { enabled: false })], { bookable: false, preview: true })} />);
    expect(headings()).toEqual(["Réserver"]);
    expect(screen.queryByTestId("module")).toBeNull();
    expect(screen.getByText("La réservation en ligne ouvrira avec la mise en ligne du site.")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Aperçu");
  });
});
