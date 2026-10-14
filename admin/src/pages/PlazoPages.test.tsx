import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

const NIGHT_OFF = { enabled: false, start: null, end: null, arrivalFeeCents: null, returnFeeCents: null };
const pricing = { tiers: [{ days: 3, priceCents: 3499 }, { days: 8, priceCents: 5500 }], extraDayPriceCents: 600, commissionBps: 1200, night: NIGHT_OFF };
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

/** What a sighted traveller reads: the text without the screen-reader-only wording. */
function seen(el: HTMLElement) {
  const copy = el.cloneNode(true) as HTMLElement;
  copy.querySelectorAll(".sr-only").forEach(n => n.remove());
  return copy.textContent;
}

/** The chips of the results preview, in order. */
function previewTags() {
  return within(screen.getByRole("list", { name: "Tags de l'annonce" }))
    .getAllByRole("listitem")
    .map(seen);
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
  shuttleWaitMinutes: null,
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
        // Night fees off, the window prefilled: kept as sent.
        { enabled: false, start: "22:00", end: "06:00", arrivalFeeCents: null, returnFeeCents: null },
      ),
    );
  });

  it("règle les frais de nuit, les simule et les enregistre (12/10/2026)", async () => {
    api.getPricing.mockResolvedValue(pricing);
    const saved = { ...pricing, night: { enabled: true, start: "22:00", end: "06:00", arrivalFeeCents: 1500, returnFeeCents: 1500 } };
    api.updatePricing.mockResolvedValue({ data: saved });
    renderPage(<PricingPage />);

    const toggle = await screen.findByRole("switch", { name: "Appliquer des frais de nuit" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(screen.queryByText("Avec frais de nuit")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Dépôt de nuit")).not.toBeInTheDocument();

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("Modifié · non enregistré")).toBeInTheDocument();
    expect(screen.getByLabelText("Début de la nuit")).toHaveValue("22:00");
    expect(screen.getByLabelText("Fin de la nuit")).toHaveValue("06:00");
    // On without any amount: a fee is required, nothing is simulated; the card says so calmly until a field is left.
    const required = screen.getByText("Indiquez au moins un montant : dépôt ou retour de nuit.");
    expect(required).not.toHaveClass("text-destructive");
    expect(screen.getByLabelText("Dépôt de nuit")).toHaveAttribute("aria-invalid", "false");
    expect(screen.getByLabelText("Retour de nuit")).toHaveAttribute("aria-invalid", "false");
    expect(screen.getByRole("button", { name: "Enregistrer les tarifs" })).toBeDisabled();
    expect(screen.queryByText("Avec frais de nuit")).not.toBeInTheDocument();
    fireEvent.blur(screen.getByLabelText("Dépôt de nuit"));
    expect(screen.getByText("Indiquez au moins un montant : dépôt ou retour de nuit.")).toHaveClass("text-destructive");
    expect(screen.getByLabelText("Dépôt de nuit")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Retour de nuit")).toHaveAttribute("aria-invalid", "true");

    fireEvent.change(screen.getByLabelText("Dépôt de nuit"), { target: { value: "15" } });
    fireEvent.change(screen.getByLabelText("Retour de nuit"), { target: { value: "15,00" } });
    expect(screen.getByText(/Un dépôt ou un retour réservé entre 22:00 et 06:00 ajoute ces frais au séjour/)).toBeInTheDocument();
    expect(screen.getByText("Avec frais de nuit")).toBeInTheDocument();
    expect(screen.getByTestId("sim-night-arrival")).toHaveTextContent("3 jForfait 3 jours + dépôt à 23:30");
    expect(screen.getByTestId("sim-night-arrival")).toHaveTextContent("49,99 €");
    expect(screen.getByTestId("sim-night-return")).toHaveTextContent("Forfait 8 jours + retour à 05:30");
    expect(screen.getByTestId("sim-night-return")).toHaveTextContent("70,00 €");
    expect(screen.getByTestId("sim-night-both")).toHaveTextContent("Forfait 8 jours + dépôt à 22:30 et retour à 05:30");
    expect(screen.getByTestId("sim-night-both")).toHaveTextContent("85,00 €");
    expect(screen.getByText(/commission \(12 %\), frais de nuit compris/)).toBeInTheDocument();

    // The same hour twice is refused.
    fireEvent.change(screen.getByLabelText("Fin de la nuit"), { target: { value: "22:00" } });
    expect(screen.getByText("Choisissez une fin différente du début.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enregistrer les tarifs" })).toBeDisabled();
    expect(screen.queryByText("Avec frais de nuit")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Fin de la nuit"), { target: { value: "06:00" } });

    fireEvent.change(screen.getByLabelText("Dépôt de nuit"), { target: { value: "abc" } });
    expect(screen.getByText("Montant invalide (ex. 15,00), 1 000 € au plus.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Dépôt de nuit"), { target: { value: "15" } });

    await userEvent.click(screen.getByRole("button", { name: "Enregistrer les tarifs" }));
    await waitFor(() =>
      expect(api.updatePricing).toHaveBeenCalledWith(pricing.tiers, 600, { enabled: true, start: "22:00", end: "06:00", arrivalFeeCents: 1500, returnFeeCents: 1500 }),
    );
    // Saved: the form matches the server again.
    await waitFor(() => expect(screen.queryByText("Modifié · non enregistré")).not.toBeInTheDocument());
    expect(screen.getByLabelText("Dépôt de nuit")).toHaveValue("15,00");
  });

  it("garde les frais de nuit enregistrés quand on les désactive, et traduit le refus du serveur", async () => {
    const night = { enabled: true, start: "21:30", end: "05:00", arrivalFeeCents: 1250, returnFeeCents: null };
    api.getPricing.mockResolvedValue({ ...pricing, night });
    api.updatePricing.mockRejectedValue(new ApiError(400, "Validation failed", "validation_failed", { "night.end": "same_time" }));
    renderPage(<PricingPage />);

    expect(await screen.findByLabelText("Début de la nuit")).toHaveValue("21:30");
    expect(screen.getByLabelText("Dépôt de nuit")).toHaveValue("12,50");
    // A return fee is not set: no example with a return.
    expect(screen.getByTestId("sim-night-arrival")).toHaveTextContent("dépôt à 23:00");
    expect(screen.queryByTestId("sim-night-return")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("switch", { name: "Appliquer des frais de nuit" }));
    expect(screen.queryByLabelText("Dépôt de nuit")).not.toBeInTheDocument();
    expect(screen.queryByText("Avec frais de nuit")).not.toBeInTheDocument();
    expect(screen.getByText(/commission \(12 %\) et vous reverse/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Enregistrer les tarifs" }));
    await waitFor(() => expect(api.updatePricing).toHaveBeenCalledWith(pricing.tiers, 600, { ...night, enabled: false }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Le début et la fin de la nuit doivent être différents."));
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
    // The tags travellers see (14/10/2026, direction C): the shuttle line, then the chips in the site's order.
    expect(seen(screen.getByTestId("preview-shuttle"))).toBe("Navette gratuite · trajet 8 min");
    expect(previewTags()).toEqual(["Extérieur", "Vous gardez vos clés", "Gratuit 24 h"]);

    await userEvent.click(screen.getByRole("button", { name: "Voiturier" }));
    await userEvent.click(screen.getByRole("button", { name: "Couvert" }));
    await userEvent.click(screen.getByRole("button", { name: "Clôturé" }));
    fireEvent.change(screen.getByLabelText("Horaires"), { target: { value: "Ouvert 5h–23h" } });
    expect(previewTags()).toEqual(["Couvert", "Vous devez remettre vos clés", "Ouvert 5h–23h", "Clôturé", "Gratuit 24 h"]);

    // Without the shuttle: no shuttle line.
    await userEvent.click(screen.getByRole("button", { name: "Navette" }));
    expect(screen.queryByTestId("preview-shuttle")).not.toBeInTheDocument();
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
      // Left empty: not declared, the tag does not show (14/10/2026).
      shuttleWaitMinutes: null,
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

  it("compte les caractères au format français et relie l'erreur du champ à sa description", async () => {
    api.getListing.mockResolvedValue({ listing: { ...savedListing, description: "a".repeat(1500) }, parking });
    api.getPricing.mockResolvedValue(pricing);
    api.updateListing.mockRejectedValue(new ApiError(400, "invalid", "validation_error", { description: "too_long" }));
    renderPage(<ListingPage />);

    const field = await screen.findByLabelText("Présentation");
    // « 1 500 / 2 000 », both numbers with the same space, not « 1500 / 2 000 ».
    expect(screen.getByTestId("description-count").textContent).toBe(`${(1500).toLocaleString("fr-FR")} / ${(2000).toLocaleString("fr-FR")}`);
    expect(screen.getByTestId("description-count")).toHaveTextContent("1 500 / 2 000");
    expect(field).toHaveAttribute("aria-describedby", "l-desc-help");

    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(field).toHaveAttribute("aria-invalid", "true"));
    expect(field).toHaveAttribute("aria-describedby", "l-desc-error l-desc-help");
    expect(document.getElementById("l-desc-error")).toHaveTextContent("Texte trop long.");
    // The help line stays: every id the field points to exists.
    expect(document.getElementById("l-desc-help")).toHaveTextContent("Les 160 premiers caractères servent de description dans Google.");
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
      expect(toast.error).toHaveBeenLastCalledWith("La rédaction par Claude n'est pas disponible : clé ANTHROPIC_API_KEY absente ou refusée.", {
        duration: 12000,
      }),
    );
    await userEvent.click(button);
    await waitFor(() => expect(toast.error).toHaveBeenLastCalledWith(expect.stringContaining("des chiffres absents de vos données (10 ; 4,5)"), { duration: 12000 }));
    await userEvent.click(button);
    await waitFor(() => expect(toast.error).toHaveBeenLastCalledWith("La rédaction par Claude a échoué (max_tokens)", { duration: 12000 }));
    expect(screen.queryByTestId("description-proposal")).not.toBeInTheDocument();
  });

  it("déclare l'attente moyenne de la navette, la vide et refuse un nombre hors limites (14/10/2026)", async () => {
    api.getListing.mockResolvedValue({ listing: { ...savedListing, shuttleWaitMinutes: 5 }, parking });
    api.getPricing.mockResolvedValue(pricing);
    api.updateListing.mockImplementation(async (input: { shuttleWaitMinutes: number | null }) => ({ data: { ...savedListing, shuttleWaitMinutes: input.shuttleWaitMinutes } }));
    renderPage(<ListingPage />);

    const field = await screen.findByLabelText("Attente moyenne de la navette (min)");
    expect(field).toHaveValue("5");
    expect(field).toHaveAttribute("aria-describedby", "l-wait-help");
    expect(document.getElementById("l-wait-help")).toHaveTextContent("Facultatif. Laissé vide, le tag n'apparaît pas.");
    // Next to the ride in the results preview.
    expect(seen(screen.getByTestId("preview-shuttle"))).toBe("Navette gratuite · trajet 8 min · attente moy. 5 min");
    // Read in full by screen readers.
    expect(screen.getByTestId("preview-shuttle")).toHaveTextContent(/attente moyenne 5 min$/);

    fireEvent.change(field, { target: { value: "12" } });
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(api.updateListing).toHaveBeenCalledTimes(1));
    expect(api.updateListing.mock.calls[0][0]).toMatchObject({ shuttleMinutes: 8, shuttleWaitMinutes: 12 });

    // Emptied: not declared any more.
    fireEvent.change(field, { target: { value: "" } });
    expect(seen(screen.getByTestId("preview-shuttle"))).toBe("Navette gratuite · trajet 8 min");
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(api.updateListing).toHaveBeenCalledTimes(2));
    expect(api.updateListing.mock.calls[1][0]).toMatchObject({ shuttleWaitMinutes: null });

    // Out of range or not whole minutes: the error shows and nothing is sent.
    for (const value of ["150", "4,5", "-3"]) {
      fireEvent.change(field, { target: { value } });
      expect(field).toHaveAttribute("aria-invalid", "true");
      expect(field).toHaveAttribute("aria-describedby", "l-wait-error l-wait-help");
      expect(document.getElementById("l-wait-error")).toHaveTextContent("Nombre entier, entre 0 et 120 minutes.");
      expect(screen.getByRole("button", { name: "Enregistrer" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Envoyer pour validation" })).toBeDisabled();
    }
    fireEvent.submit(field.closest("form")!);
    expect(api.updateListing).toHaveBeenCalledTimes(2);

    fireEvent.change(field, { target: { value: "120" } });
    expect(field).toHaveAttribute("aria-invalid", "false");
    expect(screen.queryByText("Nombre entier, entre 0 et 120 minutes.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeEnabled();
  });

  it("montre en français le refus du serveur sur l'attente moyenne", async () => {
    api.getListing.mockResolvedValue({ listing: savedListing, parking });
    api.getPricing.mockResolvedValue(pricing);
    api.updateListing.mockRejectedValue(new ApiError(400, "invalid", "validation_failed", { shuttleWaitMinutes: "too_large" }));
    renderPage(<ListingPage />);

    const field = await screen.findByLabelText("Attente moyenne de la navette (min)");
    expect(field).toHaveValue("");
    fireEvent.change(field, { target: { value: "0" } });
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(field).toHaveAttribute("aria-invalid", "true"));
    expect(api.updateListing.mock.calls[0][0]).toMatchObject({ shuttleWaitMinutes: 0 });
    expect(document.getElementById("l-wait-error")).toHaveTextContent("Nombre entier, entre 0 et 120 minutes.");
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
