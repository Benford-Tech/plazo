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

  // 24/11/2026 (« je veux pouvoir faire des sites comme celui-ci », choix B).
  const showcase = (over: Partial<ParkingSiteInfo> = {}) =>
    site([block("highlights"), block("destinations"), block("cta"), block("booking"), block("faq"), block("contact")], {
      theme: "showcase",
      accent2: "#F2B705",
      accent2Ink: "#1A1D1A",
      rating: { value: 4.8, count: 193 },
      destinations: [
        { slug: "aeroport", kind: "airport", name: "Lyon Saint-Exupéry", instructions: null },
        { slug: "gare-tgv", kind: "station", name: "Gare TGV", instructions: "Devant le hall, quai des navettes." },
      ],
      pages: ["aeroport", "gare-tgv", "questions", "contact", "mentions-legales"],
      legal: { name: "Cèdres SAS", address: "12 rue des Cèdres", siret: "12345678900012", vatNumber: null },
      ...over,
    });

  it("présentation vitrine : barre de contact, bandeau avec la note, réservation en tête, cartes des départs vers leurs pages", () => {
    render(<ParkingSite idempotencyKey="k" data={data} site={showcase()} />);
    expect(screen.getByTestId("site-topbar")).toHaveTextContent("04 72 00 00 00");
    expect(within(screen.getByTestId("site-hero")).getByRole("heading", { level: 1 })).toHaveTextContent("Parking des Cèdres");
    expect(screen.getByTestId("site-rating")).toHaveTextContent("4,8");
    expect(screen.getByTestId("site-rating")).toHaveTextContent("193 avis Google");
    // The booking comes first, whatever its place in the manager's list.
    expect(headings()[0]).toBe("Réserver");
    expect(headings()).toContain("D’où partez-vous ?");
    expect(screen.getByRole("link", { name: /En savoir plus ?: Gare TGV/ })).toHaveAttribute("href", "/s/cedres/gare-tgv");
    expect(screen.getByRole("link", { name: "Je réserve en ligne" })).toHaveAttribute("href", "/s/cedres#reserver");
    const [menu] = screen.getAllByRole("navigation", { name: "Parking des Cèdres" });
    expect(within(menu!).getAllByRole("link").map(a => a.getAttribute("href"))).toEqual([
      "/s/cedres",
      "/s/cedres/aeroport",
      "/s/cedres/gare-tgv",
      "/s/cedres/questions",
      "/s/cedres/contact",
    ]);
    expect(screen.getByRole("link", { name: "Mentions légales" })).toHaveAttribute("href", "/s/cedres/mentions-legales");
  });

  it("la page d’un départ : son titre, ses consignes, la réservation ; sur le domaine du parking les liens partent de la racine", () => {
    render(<ParkingSite idempotencyKey="k" data={data} page="gare-tgv" site={showcase({ links: { base: "", query: "" } })} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Parking proche de Gare TGV");
    expect(screen.getByText("Devant le hall, quai des navettes.")).toBeInTheDocument();
    expect(screen.getByTestId("module")).toBeInTheDocument();
    expect(screen.queryByTestId("site-rating")).toBeNull();
    expect(screen.queryByText("D’où partez-vous ?")).toBeNull();
    expect(screen.getByRole("link", { name: "Mentions légales" })).toHaveAttribute("href", "/mentions-legales");
  });

  it("les mentions légales nomment l’éditeur ; une page inconnue ne montre rien de plus que l’accueil", () => {
    const { unmount } = render(<ParkingSite idempotencyKey="k" data={data} page="mentions-legales" site={showcase()} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Mentions légales");
    expect(screen.getByText("Cèdres SAS")).toBeInTheDocument();
    expect(screen.getByText("SIRET 12345678900012")).toBeInTheDocument();
    expect(screen.queryByTestId("module")).toBeNull();
    unmount();
    render(<ParkingSite idempotencyKey="k" data={data} site={site([block("booking"), block("destinations"), block("cta")])} />);
    // The first look, one page: no card, no link to a page that does not exist.
    expect(screen.queryByRole("link", { name: /En savoir plus/ })).toBeNull();
    expect(screen.queryByTestId("site-hero")).toBeNull();
  });
});
