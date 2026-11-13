import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/lib/api";
import NotificationsPage from "./NotificationsPage";

const api = vi.hoisted(() => ({
  getPlatformNotifications: vi.fn(),
  getPlatformNotificationAudience: vi.fn(),
  sendPlatformNotification: vi.fn(),
  getPlatformOperators: vi.fn(),
  getAirports: vi.fn(),
}));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const renderIn = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <NotificationsPage />
    </QueryClientProvider>,
  );

const sent = {
  id: "n1",
  audience: "staff",
  operatorId: null,
  operatorName: null,
  title: "Mise à jour",
  body: "Nouvelle version.",
  url: null,
  recipients: 12,
  sentByName: "Joanny",
  createdAt: "2026-10-05T09:00:00Z",
};

describe("Notifications de la plateforme (E-A, C-A)", () => {
  beforeEach(() => {
    api.getPlatformNotifications.mockResolvedValue({ data: [] });
    api.getPlatformNotificationAudience.mockImplementation(async (audience: string) => ({ devices: audience === "travellers" ? 3 : 12, configured: true }));
    api.getPlatformOperators.mockResolvedValue({ defaultCommissionBps: null, operators: [{ id: "o1", name: "Parking Soleil" }] });
    api.getAirports.mockResolvedValue([{ code: "LYS", name: "Lyon Saint-Exupéry", city: "Lyon", slug: "lyon-saint-exupery" }]);
  });

  it("compte les téléphones, demande confirmation, envoie et ajoute l'envoi à l'historique", async () => {
    const user = userEvent.setup();
    api.sendPlatformNotification.mockResolvedValue({ data: sent });
    renderIn();
    expect(await screen.findByText("12 téléphones à joindre")).toBeInTheDocument();
    expect(await screen.findByText("Aucun envoi pour le moment.")).toBeInTheDocument();
    const sendButton = screen.getByRole("button", { name: "Envoyer à 12 téléphones" });
    expect(sendButton).toBeDisabled();
    await user.type(screen.getByLabelText("Titre"), "Mise à jour");
    await user.type(screen.getByLabelText("Message"), "Nouvelle version.");
    expect(sendButton).toBeEnabled();
    await user.click(sendButton);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/Envoyer ce message à 12 téléphones \(tout le personnel\)/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Envoyer" }));
    await waitFor(() => expect(api.sendPlatformNotification).toHaveBeenCalledWith({ audience: "staff", operatorId: null, title: "Mise à jour", body: "Nouvelle version.", url: null }));
    expect(toast.success).toHaveBeenCalledWith("Envoyé à 12 téléphones.");
    expect(await screen.findByText("Nouvelle version.")).toBeInTheDocument();
    expect(screen.getByLabelText("Titre")).toHaveValue("");
  });

  it("un loueur précis : la liste, le comptage par loueur ; la limite des voyageurs est traduite", async () => {
    const user = userEvent.setup();
    renderIn();
    await screen.findByText("12 téléphones à joindre");
    await user.selectOptions(screen.getByLabelText("Destinataires"), "operator");
    expect(screen.getByRole("button", { name: "Envoyer à 0 téléphone" })).toBeDisabled();
    await user.selectOptions(await screen.findByLabelText("Loueur"), "o1");
    await waitFor(() => expect(api.getPlatformNotificationAudience).toHaveBeenCalledWith("operator", "o1"));
    await user.selectOptions(screen.getByLabelText("Destinataires"), "travellers");
    expect(await screen.findByText("3 téléphones à joindre")).toBeInTheDocument();
    expect(screen.getByText("Voyageurs : deux envois par jour au plus.")).toBeInTheDocument();
    api.sendPlatformNotification.mockRejectedValue(new ApiError(429, "Daily limit", "daily_limit"));
    await user.type(screen.getByLabelText("Titre"), "Neige");
    await user.type(screen.getByLabelText("Message"), "Prévoyez 20 min de plus.");
    await user.click(screen.getByRole("button", { name: "Envoyer à 3 téléphones" }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Envoyer" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Limite atteinte : deux envois aux voyageurs par jour au plus."));
  });

  describe("Promotion (13/11/2026, direction A)", () => {
    const promo = {
      ...sent,
      id: "p1",
      audience: "promotion",
      title: "−15 % pour Noël",
      body: "Réservez vos vacances.",
      url: "https://www.plazo.fr/lyon-saint-exupery/recherche",
      link: { kind: "search", airport: "lyon-saint-exupery", arrival: "2026-12-19T08:00", return: "2027-01-03T18:00" },
      filters: { airport: "lyon-saint-exupery", noUpcoming: true },
      recipients: 7,
    };

    beforeEach(() => {
      api.getPlatformNotificationAudience.mockImplementation(async (audience: string, _op?: string | null, filters?: { airport?: string | null; noUpcoming?: boolean }) =>
        audience === "promotion"
          ? { devices: filters?.airport ? 7 : 40, configured: true, nextPromotionAt: null }
          : { devices: 12, configured: true },
      );
    });
    afterEach(() => vi.restoreAllMocks());

    it("compte les téléphones selon les filtres, confirme et envoie le lien et les filtres", async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
      api.sendPlatformNotification.mockResolvedValue({ data: promo });
      renderIn();
      await user.click(screen.getByRole("radio", { name: "Promotion" }));
      expect(await screen.findByText("40 téléphones · ont accepté les offres")).toBeInTheDocument();
      expect(screen.getByTestId("promo-accepted")).toHaveAttribute("aria-pressed", "true");
      await user.click(await screen.findByRole("button", { name: "Ont déjà réservé à Lyon" }));
      await user.click(screen.getByRole("button", { name: "Sans réservation à venir" }));
      await waitFor(() =>
        expect(api.getPlatformNotificationAudience).toHaveBeenLastCalledWith("promotion", null, { airport: "lyon-saint-exupery", noUpcoming: true }),
      );
      expect(await screen.findByText("7 téléphones · ont accepté les offres")).toBeInTheDocument();

      await user.type(screen.getByLabelText("Titre"), "−15 % pour Noël");
      await user.type(screen.getByLabelText("Message"), "Réservez vos vacances.");
      await user.click(screen.getByRole("radio", { name: "Recherche" }));
      await user.type(screen.getByLabelText("Arrivée (facultatif)"), "2026-12-19T08:00");
      await user.type(screen.getByLabelText("Retour (facultatif)"), "2027-01-03T18:00");
      expect(screen.getByTestId("promo-link-summary")).toHaveTextContent("Recherche · Lyon · 19 déc. → 3 janv.");
      expect(screen.getByTestId("promo-preview")).toHaveTextContent("−15 % pour Noël");

      await user.click(screen.getByRole("button", { name: "Envoyer la promotion" }));
      expect(confirmSpy).toHaveBeenCalledWith("Envoyer cette promotion à 7 téléphones ? Elle ne peut pas être rappelée.");
      await waitFor(() =>
        expect(api.sendPlatformNotification).toHaveBeenCalledWith({
          audience: "promotion",
          title: "−15 % pour Noël",
          body: "Réservez vos vacances.",
          link: { kind: "search", airport: "lyon-saint-exupery", arrival: "2026-12-19T08:00", return: "2027-01-03T18:00" },
          filters: { airport: "lyon-saint-exupery", noUpcoming: true },
        }),
      );
      expect(toast.success).toHaveBeenCalledWith("Promotion envoyée à 7 téléphones.");
      const row = (await screen.findByText("Réservez vos vacances.")).closest("tr")!;
      expect(within(row).getByText("Promotion")).toBeInTheDocument();
      expect(within(row).getByText("Recherche · Lyon · 19 déc. → 3 janv.")).toBeInTheDocument();
      expect(within(row).getByText("ont accepté les offres · ont déjà réservé à Lyon · sans réservation à venir")).toBeInTheDocument();
    });

    it("fiche d'un parking : l'adresse est demandée ; la limite de la semaine est traduite avec sa date", async () => {
      const user = userEvent.setup();
      vi.spyOn(window, "confirm").mockReturnValue(true);
      api.sendPlatformNotification.mockRejectedValue(
        new ApiError(429, "Weekly limit", "weekly_limit", undefined, { limit: 2, nextAt: "2026-11-18T09:30:00Z" }),
      );
      renderIn();
      await user.click(screen.getByRole("radio", { name: "Promotion" }));
      await screen.findByText("40 téléphones · ont accepté les offres");
      await user.type(screen.getByLabelText("Titre"), "Offre");
      await user.type(screen.getByLabelText("Message"), "Un parking à découvrir.");
      await user.click(screen.getByRole("radio", { name: "Fiche d'un parking" }));
      const sendButton = screen.getByRole("button", { name: "Envoyer la promotion" });
      expect(sendButton).toBeDisabled();
      await user.type(screen.getByLabelText("Parking (adresse de sa fiche)"), "parking-des-cedres");
      expect(screen.getByTestId("promo-link-summary")).toHaveTextContent("Fiche d'un parking · Lyon · parking-des-cedres");
      await user.click(sendButton);
      await waitFor(() =>
        expect(api.sendPlatformNotification).toHaveBeenCalledWith(
          expect.objectContaining({ link: { kind: "parking", airport: "lyon-saint-exupery", parking: "parking-des-cedres" } }),
        ),
      );
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/^Limite atteinte : deux promotions par semaine au plus\. Prochaine possible le .+18 nov\./)));
    });

    it("la prochaine promotion possible désactive l'envoi", async () => {
      const user = userEvent.setup();
      api.getPlatformNotificationAudience.mockResolvedValue({ devices: 40, configured: true, nextPromotionAt: "2026-11-18T09:30:00Z" });
      renderIn();
      await user.click(screen.getByRole("radio", { name: "Promotion" }));
      expect(await screen.findByText(/^Prochaine promotion possible le .+18 nov\./)).toBeInTheDocument();
      expect(screen.getByText(/Deux promotions par semaine au plus\./)).toBeInTheDocument();
      await user.type(screen.getByLabelText("Titre"), "Offre");
      await user.type(screen.getByLabelText("Message"), "Texte.");
      expect(screen.getByRole("button", { name: "Envoyer la promotion" })).toBeDisabled();
    });
  });
});
