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
    expect(within(screen.getByRole("main")).getByText("Cèdres SAS")).toBeInTheDocument();
    expect(within(screen.getByRole("main")).getByText("SIRET 12345678900012")).toBeInTheDocument();
    expect(screen.queryByTestId("module")).toBeNull();
    unmount();
    render(<ParkingSite idempotencyKey="k" data={data} site={site([block("booking"), block("destinations"), block("cta")])} />);
    // The first look, one page: no card, no link to a page that does not exist.
    expect(screen.queryByRole("link", { name: /En savoir plus/ })).toBeNull();
    expect(screen.queryByTestId("site-hero")).toBeNull();
  });

  // 24/11/2026 (« propose plusieurs modèles de sites » → « ok »).
  it.each(["night", "postcard", "home", "express"] as const)("modèle %s : le titre, la note, la réservation remontée sous le titre et les bandes", look => {
    render(<ParkingSite idempotencyKey="k" data={data} site={showcase({ theme: look })} />);
    expect(screen.getByTestId("parking-site")).toHaveAttribute("data-theme-look", look);
    expect(screen.getByTestId("site-hero")).toHaveTextContent(look === "express" ? /./ : "Parking des Cèdres");
    expect(screen.getByTestId("site-rating")).toHaveTextContent("4,8");
    expect(screen.queryByTestId("site-topbar")).toBeNull();
    expect(headings()[0]).toBe("Réserver");
    expect(document.getElementById("departs")).not.toBeNull();
  });

  it("modèle Express : le premier prix de la grille en grand, pas sur les autres pages", () => {
    const priced = { ...data, parking: { ...data.parking, pricing: { ...data.parking.pricing, tiers: [{ days: 8, priceCents: 6200 }, { days: 3, priceCents: 3400 }] } } };
    const { unmount } = render(<ParkingSite idempotencyKey="k" data={priced} site={showcase({ theme: "express" })} />);
    expect(screen.getByTestId("site-price")).toHaveTextContent(/dès\s*34,00\s€\s*3 jours/);
    unmount();
    render(<ParkingSite idempotencyKey="k" data={priced} page="contact" site={showcase({ theme: "express" })} />);
    expect(screen.queryByTestId("site-price")).toBeNull();
  });

  it("modèle Nuit : le fond sombre vient des jetons de couleur posés sur le site", () => {
    render(<ParkingSite idempotencyKey="k" data={data} site={showcase({ theme: "night" })} />);
    expect(screen.getByTestId("parking-site").style.getPropertyValue("--color-ground")).toBe("#10141b");
  });

  it("modèle Maison : la photo de l’équipe à côté du titre, sinon celle du bandeau", () => {
    const { unmount } = render(<ParkingSite idempotencyKey="k" data={data} site={showcase({ theme: "home", heroPhotoUrl: "/hero.jpg", teamPhotoUrl: "/equipe.jpg" })} />);
    expect(screen.getByTestId("site-team-photo")).toHaveAttribute("src", "/equipe.jpg");
    unmount();
    render(<ParkingSite idempotencyKey="k" data={data} site={showcase({ theme: "home", heroPhotoUrl: "/hero.jpg" })} />);
    expect(screen.getByTestId("site-team-photo")).toHaveAttribute("src", "/hero.jpg");
  });

  it("« Parc » et « Voiturier » (24/11/2026) : étapes numérotées, atouts cochés, prix par jour, formulaire et barre fixe", () => {
    const grid: ParkingResponse = {
      ...data,
      parking: {
        ...data.parking,
        pricing: {
          tiers: [
            { days: 1, priceCents: 2500 },
            { days: 3, priceCents: 3500 },
            { days: 7, priceCents: 5500 },
            { days: 14, priceCents: 10000 },
          ],
          extraDayPriceCents: 500,
        },
      },
    };
    const blocks = [block("booking"), block("highlights"), block("steps"), block("pricing"), block("contact")];
    const { unmount } = render(<ParkingSite idempotencyKey="k" data={grid} site={site(blocks, { theme: "park" })} />);
    expect(screen.getByTestId("parking-site")).toHaveAttribute("data-theme-look", "park");
    expect(within(screen.getByTestId("site-steps")).getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByTestId("site-strengths")).toBeInTheDocument();
    const cards = within(screen.getByTestId("site-price-cards")).getAllByRole("listitem");
    expect(cards.map(c => c.textContent?.replace(/\s/g, " "))).toEqual([
      "3 jours35,00 €soit 11,67 € par jour",
      "7 jours55,00 €soit 7,86 € par jour",
      "14 jours100,00 €soit 7,14 € par jour",
    ]);
    expect(screen.getByText("Voir toute la grille")).toBeInTheDocument();
    expect(screen.getByTestId("site-contact-form")).toBeInTheDocument();
    expect(screen.getByText("Ma réservation")).toBeInTheDocument();
    const bar = screen.getByTestId("site-sticky-bar");
    expect(within(bar).getByText("Appeler").closest("a")).toHaveAttribute("href", "tel:0472000000");
    expect(within(bar).getByText("Écrire").closest("a")).toHaveAttribute("href", "/s/cedres#contact");
    unmount();

    render(<ParkingSite idempotencyKey="k" data={grid} site={site(blocks, { theme: "valet" })} />);
    expect(within(screen.getByTestId("site-steps")).getAllByRole("listitem")).toHaveLength(4);
    expect(screen.queryByTestId("site-strengths")).toBeNull();
    expect(screen.queryByText("Ma réservation")).toBeNull();
  });

  it("pied de page « Plan d'accès » (25/11/2026) : plan, adresse, horaires, appel, itinéraire, liens et société", () => {
    const withHours = { ...data, parking: { ...data.parking, openingHours: "Ouvert 24h/24" } };
    render(
      <ParkingSite
        idempotencyKey="k"
        data={withHours}
        site={site([block("booking"), block("pricing")], { legal: { name: "Cèdres SAS", address: null, siret: "12345678900012", vatNumber: "FR12123456789" } })}
      />,
    );
    const foot = within(screen.getByTestId("site-footer"));
    expect(foot.getByTestId("site-footer-plan")).toHaveTextContent("Lyon Saint-Exupéry · 8 min");
    expect(foot.getByText("12 rue des Cèdres, Colombier-Saugnieu")).toBeInTheDocument();
    expect(foot.getByText(/Ouvert 24h\/24/)).toBeInTheDocument();
    expect(foot.getByRole("link", { name: "Appeler" })).toHaveAttribute("href", "tel:0472000000");
    expect(foot.getByRole("link", { name: "Itinéraire" }).getAttribute("href")).toContain("12%20rue%20des%20C");
    expect(foot.getByRole("navigation", { name: "Liens du site" })).toHaveTextContent("Tarifs");
    expect(foot.getByText(/© \d{4} Cèdres SAS/)).toBeInTheDocument();
    expect(foot.getByText("SIRET 12345678900012")).toBeInTheDocument();
    expect(foot.getByText("N° de TVA FR12123456789")).toBeInTheDocument();
    expect(foot.getByText(/sécurisés par Plazo/)).toBeInTheDocument();
  });

  it("le style sobre garde son tableau, sans formulaire ni barre fixe", () => {
    render(<ParkingSite idempotencyKey="k" data={data} site={site([block("booking"), block("pricing"), block("contact")])} />);
    expect(screen.queryByTestId("site-price-cards")).toBeNull();
    expect(screen.queryByTestId("site-contact-form")).toBeNull();
    expect(screen.queryByTestId("site-sticky-bar")).toBeNull();
  });
});
