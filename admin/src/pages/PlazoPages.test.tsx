import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import ListingPage from "./ListingPage";
import PricingPage from "./PricingPage";

const api = vi.hoisted(() => ({
  getListing: vi.fn(),
  updateListing: vi.fn(),
  submitListing: vi.fn(),
  withdrawListing: vi.fn(),
  getPricing: vi.fn(),
  updatePricing: vi.fn(),
  getPaymentStatus: vi.fn(),
  suggestListingDescription: vi.fn(),
}));
const auth = vi.hoisted(() => ({ user: { role: "manager", emailVerified: true, viewAs: null } as Record<string, unknown> }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: auth.user }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...Object.fromEntries(Object.entries(api).map(([k, f]) => [k, (...a: unknown[]) => f(...a)])) } };
});

const pricing = { tiers: [{ days: 3, priceCents: 3499 }, { days: 8, priceCents: 5500 }], extraDayPriceCents: 600, commissionBps: 1200 };
const PAYMENTS_OFF = {
  enabled: false,
  testMode: false,
  connected: false,
  detailsSubmitted: false,
  chargesEnabled: false,
  payoutsEnabled: false,
  commissionBps: null,
  payoutSchedule: "AFTER_STAY",
};
const parking = { id: "p1", name: "Parking Démo LYS", address: null, shuttleTravelMinutes: 8 };

function renderPage(page: React.ReactNode, path = "/") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>{page}</MemoryRouter>
    </QueryClientProvider>,
  );
}

const savedListing = {
  id: "l1",
  slug: "parking-demo-lys",
  status: "draft",
  reviewMessage: null,
  submittedAt: null,
  reviewedAt: null,
  title: "Parking Démo LYS",
  description: null,
  services: ["shuttle"],
  shuttleMinutes: 8,
  distanceKm: null,
  openingHours: null,
  cancellationPolicy: "free_24h",
  photos: [],
  airport: { code: "LYS", name: "Lyon Saint-Exupéry", slug: "lyon-saint-exupery" },
};

describe("Mes tarifs", () => {
  beforeEach(() => {
    Object.values(api).forEach(f => f.mockReset());
    // Online payments off: the "Sur Plazo" pages show a neutral line above the tabs.
    api.getPaymentStatus.mockResolvedValue({ ...PAYMENTS_OFF });
  });

  it("simule le prix payé et enregistre la grille triée", async () => {
    api.getPricing.mockResolvedValue(pricing);
    api.updatePricing.mockResolvedValue({ data: pricing });
    renderPage(<PricingPage />);

    expect(await screen.findByTestId("sim-2")).toHaveTextContent("Forfait 3 jours");
    expect(screen.getByTestId("sim-10")).toHaveTextContent("8 jours + 2 ×");
    expect(screen.getByText(/commission \(12 %\)/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "+ Ajouter un forfait" }));
    const price = screen.getByLabelText("Prix tout compris 3");
    await userEvent.type(price, "abc");
    expect(screen.getByText("Prix invalide (ex. 34,99).")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enregistrer les tarifs" })).toBeDisabled();
    expect(screen.getByText("Modifié · non enregistré")).toBeInTheDocument();

    fireEvent.change(price, { target: { value: "79" } });
    fireEvent.change(screen.getByLabelText("Durée 1"), { target: { value: "15" } });
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer les tarifs" }));
    await waitFor(() =>
      expect(api.updatePricing).toHaveBeenCalledWith(
        [
          { days: 8, priceCents: 5500 },
          { days: 9, priceCents: 7900 },
          { days: 15, priceCents: 3499 },
        ],
        600,
      ),
    );
  });
});

describe("Ma fiche", () => {
  beforeEach(() => {
    Object.values(api).forEach(f => f.mockReset());
    // Online payments off: the "Sur Plazo" pages show a neutral line above the tabs.
    api.getPaymentStatus.mockResolvedValue({ ...PAYMENTS_OFF });
  });

  it("préremplit une première fiche et met à jour l'aperçu", async () => {
    api.getListing.mockResolvedValue({ listing: null, parking });
    api.getPricing.mockResolvedValue(pricing);
    renderPage(<ListingPage />);

    expect(await screen.findByLabelText("Nom affiché")).toHaveValue("Parking Démo LYS");
    expect(screen.getByLabelText("Adresse de la page")).toHaveValue("parking-demo-lys");
    expect(await screen.findByText("dès 34,99 €")).toBeInTheDocument();
    expect(screen.getByText(/Navette 8 min/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Voiturier" }));
    expect(screen.getByText(/Voiturier/, { selector: "div" })).toBeInTheDocument();
  });

  it("enregistre puis envoie la fiche pour validation, et explique le refus sans tarifs", async () => {
    api.getListing.mockResolvedValue({ listing: null, parking });
    api.getPricing.mockResolvedValue({ ...pricing, tiers: [] });
    api.updateListing.mockResolvedValue({ data: savedListing });
    api.submitListing.mockRejectedValue(new ApiError(400, "Set prices before sending the listing", "pricing_required"));
    renderPage(<ListingPage />, "/plazo/fiche?bienvenue=1");

    expect(await screen.findByText("Bienvenue ! Votre compte est créé.")).toBeInTheDocument();
    expect(screen.getByText("Brouillon")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Distance (km)"), { target: { value: "3,5" } });
    await userEvent.click(screen.getByRole("button", { name: "Envoyer pour validation" }));
    await waitFor(() => expect(api.submitListing).toHaveBeenCalled());
    expect(api.updateListing.mock.calls[0][0]).toEqual({
      airportCode: "LYS",
      slug: "parking-demo-lys",
      title: "Parking Démo LYS",
      description: null,
      services: ["shuttle"],
      shuttleMinutes: 8,
      distanceKm: 3.5,
      openingHours: null,
      cancellationPolicy: "free_24h",
      photos: [],
    });
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/^Enregistrez d'abord vos tarifs/)));
  });

  it("montre le refus de l'équipe et bloque l'envoi tant que l'email n'est pas confirmé", async () => {
    auth.user = { emailVerified: false, viewAs: null };
    api.getListing.mockResolvedValue({ listing: { ...savedListing, status: "rejected", reviewMessage: "Ajoutez une photo." }, parking });
    api.getPricing.mockResolvedValue(pricing);
    renderPage(<ListingPage />);

    expect(await screen.findByText("Ajoutez une photo.")).toBeInTheDocument();
    expect(screen.getByText("Refusée")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Envoyer pour validation" })).toBeDisabled();
    auth.user = { emailVerified: true, viewAs: null };
  });

  it("rédige la présentation avec Claude et la reprend dans le champ sans enregistrer", async () => {
    api.getListing.mockResolvedValue({ listing: null, parking });
    api.getPricing.mockResolvedValue(pricing);
    const text = "Parking Démo LYS, parking clôturé près de Lyon Saint-Exupéry.\n\nNavette en 8 min.";
    api.suggestListingDescription.mockResolvedValue({ text, model: "claude-opus-5-5" });
    renderPage(<ListingPage />);

    const field = await screen.findByLabelText("Présentation");
    expect(field).toHaveAttribute("maxLength", "2000");
    expect(screen.getByText("Les 160 premiers caractères servent de description dans Google.")).toBeInTheDocument();
    expect(screen.getByTestId("description-count")).toHaveTextContent("0 / 2 000");

    await userEvent.click(screen.getByRole("button", { name: "Rédiger avec Claude" }));
    const card = await screen.findByTestId("description-proposal");
    expect(api.suggestListingDescription).toHaveBeenCalledWith(null);
    expect(card).toHaveTextContent("Proposition de Claude");
    expect(card).toHaveTextContent("Navette en 8 min.");
    expect(card).toHaveTextContent(`${text.length} / 2 000`);

    await userEvent.click(screen.getByRole("button", { name: "Utiliser ce texte" }));
    expect(field).toHaveValue(text);
    expect(screen.queryByTestId("description-proposal")).not.toBeInTheDocument();
    expect(screen.getByTestId("description-count")).toHaveTextContent(`${text.length} / 2 000`);
    expect(toast.success).toHaveBeenCalledWith("Texte repris dans la présentation : relisez-le, puis enregistrez la fiche.");
    // Nothing is saved until « Enregistrer ».
    expect(api.updateListing).not.toHaveBeenCalled();
  });

  it("améliore le texte en place, propose une autre version et s'ignore", async () => {
    api.getListing.mockResolvedValue({ listing: { ...savedListing, description: "Parking sûr, navette." }, parking });
    api.getPricing.mockResolvedValue(pricing);
    api.suggestListingDescription.mockResolvedValueOnce({ text: "Première version.", model: "m" }).mockResolvedValueOnce({ text: "Deuxième version.", model: "m" });
    renderPage(<ListingPage />);

    await userEvent.click(await screen.findByRole("button", { name: "Améliorer avec Claude" }));
    expect(await screen.findByText("Première version.")).toBeInTheDocument();
    expect(api.suggestListingDescription).toHaveBeenLastCalledWith("Parking sûr, navette.");

    await userEvent.click(screen.getByRole("button", { name: "Proposer une autre version" }));
    expect(await screen.findByText("Deuxième version.")).toBeInTheDocument();
    expect(api.suggestListingDescription).toHaveBeenCalledTimes(2);
    expect(api.suggestListingDescription).toHaveBeenLastCalledWith("Parking sûr, navette.");

    await userEvent.click(screen.getByRole("button", { name: "Ignorer" }));
    expect(screen.queryByTestId("description-proposal")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Présentation")).toHaveValue("Parking sûr, navette.");
  });

  it("explique pourquoi Claude n'a rien proposé, avec les mots de la présentation", async () => {
    api.getListing.mockResolvedValue({ listing: null, parking });
    api.getPricing.mockResolvedValue(pricing);
    api.suggestListingDescription
      .mockRejectedValueOnce(new ApiError(409, "no key", "ai_unavailable"))
      .mockRejectedValueOnce(new ApiError(502, "invented", "ai_unreliable", undefined, { reason: "unsupported_figure", figures: ["10", "4.5"] }))
      .mockRejectedValueOnce(new ApiError(502, "failed", "ai_failed", undefined, { reason: "max_tokens" }));
    renderPage(<ListingPage />);

    const button = await screen.findByRole("button", { name: "Rédiger avec Claude" });
    await userEvent.click(button);
    await waitFor(() =>
      expect(toast.error).toHaveBeenLastCalledWith("La rédaction par Claude n'est pas disponible : clé ANTHROPIC_API_KEY absente.", { duration: 12000 }),
    );
    await userEvent.click(button);
    await waitFor(() => expect(toast.error).toHaveBeenLastCalledWith(expect.stringContaining("des chiffres absents de vos données (10, 4,5)"), { duration: 12000 }));
    await userEvent.click(button);
    await waitFor(() => expect(toast.error).toHaveBeenLastCalledWith("La rédaction par Claude a échoué (max_tokens)", { duration: 12000 }));
    expect(screen.queryByTestId("description-proposal")).not.toBeInTheDocument();
  });

  it("une fiche publiée peut être retirée par le loueur", async () => {
    api.getListing.mockResolvedValue({ listing: { ...savedListing, status: "published" }, parking });
    api.getPricing.mockResolvedValue(pricing);
    api.withdrawListing.mockResolvedValue({ data: { ...savedListing, status: "draft" } });
    renderPage(<ListingPage />);

    await userEvent.click(await screen.findByRole("button", { name: "Retirer de Plazo" }));
    await waitFor(() => expect(api.withdrawListing).toHaveBeenCalled());
    expect(await screen.findByRole("button", { name: "Envoyer pour validation" })).toBeInTheDocument();
  });
});
