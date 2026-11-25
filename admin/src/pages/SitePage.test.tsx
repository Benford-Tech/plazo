import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { SiteBlock, SiteSettings } from "@/lib/types";
import SitePage from "./SitePage";

/** 22/11/2026 (« pouvoir créer un site dédié au parking », « le plus modulaire possible », « le site est en supplément »). */

const auth = vi.hoisted(() => ({ user: { demo: null as unknown } as Record<string, unknown> }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth }));
const api = vi.hoisted(() => ({ getSite: vi.fn(), updateSite: vi.fn(), requestSite: vi.fn(), setPlatformSite: vi.fn(), setSiteDomain: vi.fn(), checkSiteDomain: vi.fn() }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...Object.fromEntries(Object.entries(api).map(([k, f]) => [k, (...a: unknown[]) => f(...a)])) } };
});
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const block = (kind: SiteBlock["kind"], over: Partial<SiteBlock> = {}): SiteBlock => ({ id: kind, kind, enabled: true, title: null, text: null, ...over });
const settings = (over: Partial<SiteSettings> = {}): SiteSettings => ({
  slug: "parking-des-cedres",
  saved: true,
  accent: "#0E5FA8",
  blocks: [block("booking"), block("pricing"), block("faq", { enabled: false })],
  theme: "simple",
  accent2: null,
  heroPhotoUrl: null,
  teamPhotoUrl: null,
  showLogo: false,
  hasLogo: false,
  rating: null,
  pages: false,
  published: false,
  listingOnline: true,
  listingTitle: "Parking des Cèdres",
  url: "https://www.plazo.example/s/parking-des-cedres",
  previewUrl: "https://www.plazo.example/s/parking-des-cedres?apercu=abc",
  addon: { active: false, requestedAt: null, priceCents: 2900 },
  domain: null,
  ...over,
});

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <SitePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
const order = () => within(screen.getByTestId("site-blocks")).getAllByRole("listitem").map(li => li.getAttribute("data-testid"));

beforeEach(() => {
  vi.clearAllMocks();
  auth.user = { demo: null };
});

describe("Mon site", () => {
  it("les blocs se rangent, s'éteignent, se retitrent ; un texte libre s'ajoute ; « Enregistrer » envoie le tout", async () => {
    const user = userEvent.setup();
    api.getSite.mockResolvedValue({ data: settings() });
    api.updateSite.mockImplementation(async (input: { blocks: SiteBlock[] }) => ({ data: settings({ blocks: input.blocks.map((b, i) => ({ ...b, id: `${b.kind}-${i}` })) }) }));
    renderPage();
    expect(await screen.findByRole("heading", { name: "Mon site" })).toBeInTheDocument();
    expect(order()).toEqual(["site-block-booking", "site-block-pricing", "site-block-faq"]);
    const save = screen.getByRole("button", { name: "Enregistrer" });
    expect(save).toBeDisabled();
    // « Réserver » is always shown.
    expect(screen.getByRole("switch", { name: "Afficher « Réserver »" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Monter « Tarifs »" }));
    expect(order()).toEqual(["site-block-pricing", "site-block-booking", "site-block-faq"]);
    await user.click(screen.getByRole("switch", { name: "Afficher « Questions fréquentes »" }));
    await user.click(screen.getByRole("button", { name: /^Tarifs/ }));
    await user.type(screen.getByLabelText(/Titre du bloc/), "Nos tarifs");
    await user.click(screen.getByRole("button", { name: "+ Ajouter un texte" }));
    await user.clear(screen.getByLabelText("Texte"));
    await user.type(screen.getByLabelText("Texte"), "Bienvenue.");

    expect(save).toBeEnabled();
    await user.click(save);
    expect(api.updateSite).toHaveBeenCalledWith({
      slug: "parking-des-cedres",
      accent: "#0E5FA8",
      blocks: [
        { kind: "pricing", enabled: true, title: "Nos tarifs", text: null },
        { kind: "booking", enabled: true, title: null, text: null },
        { kind: "faq", enabled: true, title: null, text: null },
        { kind: "text", enabled: true, title: null, text: "Bienvenue." },
      ],
      theme: "simple",
      accent2: null,
      showLogo: false,
      pages: false,
      rating: null,
    });
    expect(toast.success).toHaveBeenCalledWith("Site enregistré.");
  });

  it("sans l'option : le prix, l'aperçu, la demande ; pas de mise en ligne", async () => {
    const user = userEvent.setup();
    api.getSite.mockResolvedValue({ data: settings() });
    api.requestSite.mockResolvedValue({ data: settings({ addon: { active: false, requestedAt: "2026-11-22T10:00:00Z", priceCents: 2900 } }) });
    renderPage();
    const addon = await screen.findByTestId("site-addon");
    expect(addon).toHaveTextContent("29 € HT par mois");
    expect(screen.getByRole("link", { name: "Voir l'aperçu" })).toHaveAttribute("href", expect.stringContaining("apercu=abc"));
    expect(screen.queryByRole("button", { name: "Mettre mon site en ligne" })).toBeNull();
    await user.click(within(addon).getByRole("button", { name: "Demander l'option" }));
    expect(await within(screen.getByTestId("site-addon")).findByText(/Demandée le 22 novembre/)).toBeInTheDocument();
  });

  it("super admin en consultation : il active l'option lui-même au lieu de la demander (25/11/2026)", async () => {
    const user = userEvent.setup();
    auth.user = { demo: null, isPlatformAdmin: true, viewAs: { operatorId: "op-1", operatorName: "GoPark" } };
    api.getSite.mockResolvedValue({ data: settings() });
    api.setPlatformSite.mockResolvedValue({ data: {} });
    renderPage();
    const addon = await screen.findByTestId("site-addon");
    expect(within(addon).queryByRole("button", { name: "Demander l'option" })).toBeNull();
    await user.click(within(addon).getByTestId("site-addon-activate"));
    expect(api.setPlatformSite).toHaveBeenCalledWith("op-1", true);
    expect(api.requestSite).not.toHaveBeenCalled();
  });

  it("avec l'option : mise en ligne, puis le lien du site", async () => {
    const user = userEvent.setup();
    const active = { active: true, requestedAt: null, priceCents: 2900 };
    api.getSite.mockResolvedValue({ data: settings({ addon: active }) });
    api.updateSite.mockResolvedValue({ data: settings({ addon: active, published: true }) });
    renderPage();
    expect(await screen.findByTestId("site-state")).toHaveTextContent("Hors ligne");
    expect(screen.queryByTestId("site-addon")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Mettre mon site en ligne" }));
    expect(api.updateSite).toHaveBeenCalledWith({ published: true });
    expect(await screen.findByRole("link", { name: "Ouvrir mon site" })).toHaveAttribute("href", "https://www.plazo.example/s/parking-des-cedres");
    expect(screen.getByTestId("site-state")).toHaveTextContent("En ligne");
  });

  it("nom de domaine : le gérant le pose, lit l'enregistrement à créer et suit son état", async () => {
    const user = userEvent.setup();
    const active = { active: true, requestedAt: null, priceCents: 2900 };
    const domain = {
      name: "www.parking-des-cedres.fr",
      record: { type: "CNAME" as const, name: "www", value: "cname.vercel-dns.com" },
      active: false,
      issue: "dns_missing",
      checkedAt: "2026-11-22T15:00:00Z",
      automatic: false,
    };
    api.getSite.mockResolvedValue({ data: settings({ addon: active }) });
    api.setSiteDomain.mockResolvedValue({ data: settings({ addon: active, domain }) });
    api.checkSiteDomain.mockResolvedValue({ data: settings({ addon: active, domain: { ...domain, issue: "not_attached" } }) });
    renderPage();
    const section = await screen.findByTestId("site-domain");
    await user.type(within(section).getByLabelText("Nom de domaine"), "www.parking-des-cedres.fr");
    await user.click(within(section).getByRole("button", { name: "Utiliser ce nom de domaine" }));
    expect(api.setSiteDomain).toHaveBeenCalledWith("www.parking-des-cedres.fr");
    expect(await within(section).findByTestId("site-domain-state")).toHaveTextContent("En attente de l'enregistrement");
    expect(section).toHaveTextContent("CNAME");
    expect(section).toHaveTextContent("cname.vercel-dns.com");

    await user.click(within(section).getByRole("button", { name: "Vérifier" }));
    expect(await within(section).findByText(/L'équipe Plazo termine le branchement/)).toBeInTheDocument();
    expect(within(section).getByTestId("site-domain-state")).toHaveTextContent("Enregistrement en place");
  });

  it("nom de domaine : il ne fait pas partie de l'option, le champ est là sans elle", async () => {
    api.getSite.mockResolvedValue({ data: settings() });
    renderPage();
    const section = await screen.findByTestId("site-domain");
    expect(within(section).getByLabelText("Nom de domaine")).toBeInTheDocument();
    expect(section).not.toHaveTextContent("fait partie de l'option");
  });

  // 24/11/2026 (« je veux pouvoir faire des sites comme celui-ci », choix B).
  it("présentation : style Vitrine, deuxième couleur, note Google tapée et plusieurs pages partent avec « Enregistrer »", async () => {
    const user = userEvent.setup();
    api.getSite.mockResolvedValue({ data: settings() });
    api.updateSite.mockResolvedValue({ data: settings({ theme: "showcase", accent2: "#F2B705", rating: { value: 4.8, count: 193 }, pages: true }) });
    renderPage();
    const look = within(await screen.findByTestId("site-look"));
    expect(look.getByRole("button", { name: "Sobre" })).toHaveAttribute("aria-pressed", "true");
    // No logo yet: the page says where to add it.
    expect(look.getByRole("link", { name: "Parking › Réglages" })).toBeInTheDocument();
    await user.click(look.getByRole("button", { name: "Nuit" }));
    expect(look.getByTestId("site-theme-hint")).toHaveTextContent("Fond sombre");
    // The photo of the team is asked for in the « Maison » style only.
    expect(look.queryByLabelText("Photo de l'équipe")).toBeNull();
    await user.click(look.getByRole("button", { name: "Maison" }));
    expect(look.getByLabelText("Photo de l'équipe")).toBeInTheDocument();
    await user.click(look.getByRole("button", { name: "Affiche" }));
    await user.click(look.getByRole("checkbox"));
    await user.type(look.getByLabelText("Note sur 5"), "4,8");
    await user.type(look.getByLabelText("Nombre d'avis"), "193 avis");
    await user.click(look.getByRole("switch", { name: "Plusieurs pages" }));
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));
    expect(api.updateSite).toHaveBeenCalledWith(
      expect.objectContaining({ theme: "showcase", accent2: "#F2B705", showLogo: false, pages: true, rating: { value: "4,8", count: "193" } }),
    );
    expect(toast.success).toHaveBeenCalledWith("Site enregistré.");
  });
});
