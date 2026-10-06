import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import type { PaymentStatus } from "@/lib/types";
import { stripeNavigation } from "@/lib/payments";
import { OnlinePayments } from "./OnlinePayments";

const api = vi.hoisted(() => ({
  getPaymentStatus: vi.fn(),
  startPaymentOnboarding: vi.fn(),
  getStripeDashboardLink: vi.fn(),
  getPayoutSettings: vi.fn(),
  updatePayoutSettings: vi.fn(),
}));
const auth = vi.hoisted(() => ({
  user: { role: "manager", viewAs: null } as Record<string, unknown>,
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: auth.user }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    adminApi: {
      ...actual.adminApi,
      ...Object.fromEntries(Object.entries(api).map(([k, f]) => [k, (...a: unknown[]) => f(...a)])),
    },
  };
});

const base: PaymentStatus = {
  enabled: true,
  testMode: true,
  connected: false,
  detailsSubmitted: false,
  chargesEnabled: false,
  payoutsEnabled: false,
  commissionBps: 1200,
  payoutSchedule: "AFTER_STAY",
};

function Location() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname + location.search}</span>;
}

function renderPanel(status: Partial<PaymentStatus> = {}, path = "/plazo/fiche") {
  api.getPaymentStatus.mockResolvedValue({ ...base, ...status });
  api.getPayoutSettings.mockResolvedValue({
    payoutSchedule: status.payoutSchedule ?? "AFTER_STAY",
  });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <OnlinePayments />
        <Location />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

let assign: ReturnType<typeof vi.fn>;
beforeEach(() => {
  Object.values(api).forEach(f => f.mockReset());
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.error).mockReset();
  auth.user = { role: "manager", viewAs: null };
  assign = vi.fn();
  vi.spyOn(stripeNavigation, "goTo").mockImplementation(assign);
});
afterEach(() => vi.restoreAllMocks());

describe("Paiements en ligne", () => {
  it("à activer : encart jaune avec la commission, les étapes et le mode test ; le bouton mène à Stripe", async () => {
    api.startPaymentOnboarding.mockResolvedValue({
      url: "https://connect.stripe.test/setup",
      expiresAt: "2026-10-02T12:00:00Z",
    });
    renderPanel();

    const box = await screen.findByTestId("payments-activate");
    expect(within(box).getByText("Paiements en ligne · à activer")).toBeInTheDocument();
    expect(
      within(box).getByRole("heading", {
        name: /Recevez l'argent des réservations .* sur votre compte bancaire/,
      }),
    ).toBeInTheDocument();
    expect(within(box).getByText("12 %")).toBeInTheDocument();
    expect(box).toHaveTextContent("vos reversements restent en attente");
    expect(within(box).getByText("1. Vos informations et votre IBAN chez Stripe")).toHaveAttribute("aria-current", "step");
    expect(box).toHaveTextContent("Mode test : aucun argent réel.");

    await userEvent.click(within(box).getByRole("button", { name: "Activer les paiements ›" }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith("https://connect.stripe.test/setup"));
    expect(api.startPaymentOnboarding).toHaveBeenCalledTimes(1);
  });

  it("commission non définie : « à définir » ; clé live : pas de mention du mode test", async () => {
    renderPanel({ commissionBps: null, testMode: false });
    const box = await screen.findByTestId("payments-activate");
    expect(within(box).getByText("à définir")).toBeInTheDocument();
    expect(box).toHaveTextContent("Vous serez redirigé vers Stripe, notre prestataire de paiement.");
    expect(box).not.toHaveTextContent("Mode test");
  });

  it("erreur de Stripe traduite", async () => {
    api.startPaymentOnboarding.mockRejectedValue(new ApiError(502, "x", "payments_unavailable"));
    renderPanel();
    await userEvent.click(await screen.findByRole("button", { name: "Activer les paiements ›" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Stripe ne répond pas. Réessayez dans un instant."));
  });

  it("vérification en cours : dossier envoyé, virements pas encore ouverts", async () => {
    api.startPaymentOnboarding.mockResolvedValue({
      url: "https://connect.stripe.test/again",
      expiresAt: "2026-10-02T12:00:00Z",
    });
    renderPanel({ connected: true, detailsSubmitted: true });
    const box = await screen.findByTestId("payments-pending");
    expect(
      within(box).getByRole("heading", {
        name: /Vérification en cours chez Stripe/,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("payments-activate")).not.toBeInTheDocument();
    await userEvent.click(within(box).getByRole("button", { name: "Compléter mon dossier ›" }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith("https://connect.stripe.test/again"));
  });

  it("compte connecté mais dossier pas envoyé : encore « à activer »", async () => {
    renderPanel({ connected: true, detailsSubmitted: false });
    expect(await screen.findByTestId("payments-activate")).toBeInTheDocument();
  });

  it("actifs : une seule ligne, « Gérer sur Stripe » ouvre le tableau de bord", async () => {
    api.getStripeDashboardLink.mockResolvedValue({
      url: "https://connect.stripe.test/express/acct_1",
    });
    renderPanel({
      connected: true,
      detailsSubmitted: true,
      chargesEnabled: true,
      payoutsEnabled: true,
    });
    const line = await screen.findByTestId("payments-active");
    expect(line).toHaveTextContent("Paiements en ligne : actifs ✓");
    expect(screen.queryByTestId("payments-activate")).not.toBeInTheDocument();
    expect(screen.queryByTestId("payments-pending")).not.toBeInTheDocument();
    await userEvent.click(within(line).getByRole("button", { name: "Gérer sur Stripe ›" }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith("https://connect.stripe.test/express/acct_1"));
  });

  it("paiement en ligne désactivé côté serveur : une ligne neutre, pas de calendrier", async () => {
    renderPanel({ enabled: false, testMode: false });
    expect(await screen.findByTestId("payments-disabled")).toHaveTextContent("pas encore ouverts");
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(api.getPayoutSettings).not.toHaveBeenCalled();
  });

  it("réservé au gérant : rien pour les autres rôles, aucun appel", async () => {
    auth.user = { role: "agent", viewAs: null };
    renderPanel();
    await new Promise(r => setTimeout(r, 0));
    expect(screen.queryByText(/Paiements en ligne/)).not.toBeInTheDocument();
    expect(api.getPaymentStatus).not.toHaveBeenCalled();
  });

  it("consultation par la plateforme : lecture seule, sans bouton ni changement de calendrier", async () => {
    auth.user = {
      role: "manager",
      viewAs: { operatorId: "o1", operatorName: "Loueur" },
    };
    renderPanel();
    const box = await screen.findByTestId("payments-activate");
    expect(within(box).queryByRole("button")).not.toBeInTheDocument();
    expect(box).toHaveTextContent("Consultation : seul le loueur");
    const group = screen.getByRole("radiogroup");
    expect(group).toHaveAttribute("aria-readonly", "true");
    await userEvent.click(within(group).getByRole("radio", { name: /Chaque mois/ }));
    expect(api.updatePayoutSettings).not.toHaveBeenCalled();
    expect(within(group).getByRole("radio", { name: /Fin du séjour/ })).toHaveAttribute("aria-checked", "true");
  });

  it("consultation, paiements actifs : pas de lien vers le tableau de bord du loueur", async () => {
    auth.user = {
      role: "manager",
      viewAs: { operatorId: "o1", operatorName: "Loueur" },
    };
    renderPanel({
      connected: true,
      detailsSubmitted: true,
      payoutsEnabled: true,
      chargesEnabled: true,
    });
    const line = await screen.findByTestId("payments-active");
    expect(within(line).queryByRole("button")).not.toBeInTheDocument();
  });

  it("retour de Stripe : « Dossier envoyé à Stripe » ; le paramètre est retiré", async () => {
    renderPanel({}, "/plazo/fiche?stripe=retour&bienvenue=1");
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Dossier envoyé à Stripe"));
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/plazo/fiche?bienvenue=1"));
    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  it("lien expiré : « Lien expiré, recommencez »", async () => {
    renderPanel({}, "/plazo/fiche?stripe=relance");
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Lien expiré, recommencez"));
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent(/^\/plazo\/fiche$/));
  });
});

describe("Quand recevoir votre argent ?", () => {
  it("quatre choix, « Fin du séjour » conseillé et choisi par défaut ; un clic enregistre", async () => {
    api.updatePayoutSettings.mockResolvedValue({ payoutSchedule: "WEEKLY" });
    renderPanel();
    const group = await screen.findByRole("radiogroup", {
      name: "Quand recevoir votre argent ?",
    });
    const radios = within(group).getAllByRole("radio");
    expect(radios.map(r => r.textContent)).toEqual([
      "Au dépôtle lendemain de l'arrivée du véhicule",
      "● Fin du séjourle lendemain du retour · conseillé",
      "Chaque semainele lundi, séjours terminés",
      "Chaque moisle 1er, séjours terminés",
    ]);
    await waitFor(() => expect(within(group).getByRole("radio", { name: /Fin du séjour/ })).toHaveAttribute("aria-checked", "true"));
    expect(screen.getByText(/vous vire le reste à la date choisie\. Stripe verse ensuite sur votre IBAN sous 2 à 7 jours\./)).toBeInTheDocument();

    await userEvent.click(within(group).getByRole("radio", { name: /Chaque semaine/ }));
    await waitFor(() => expect(api.updatePayoutSettings).toHaveBeenCalledWith("WEEKLY"));
    expect(within(group).getByRole("radio", { name: /Chaque semaine/ })).toHaveAttribute("aria-checked", "true");
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Calendrier de reversement enregistré"));
  });

  it("au clavier : un seul arrêt de tabulation, les flèches changent le choix", async () => {
    api.updatePayoutSettings.mockImplementation(async (payoutSchedule: string) => ({ payoutSchedule }));
    renderPanel({
      connected: true,
      detailsSubmitted: true,
      payoutsEnabled: true,
      chargesEnabled: true,
    });
    const group = await screen.findByRole("radiogroup");
    await waitFor(() => expect(within(group).getByRole("radio", { name: /Fin du séjour/ })).toHaveAttribute("tabindex", "0"));
    expect(
      within(group)
        .getAllByRole("radio")
        .filter(r => r.tabIndex === 0),
    ).toHaveLength(1);

    within(group)
      .getByRole("radio", { name: /Fin du séjour/ })
      .focus();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(api.updatePayoutSettings).toHaveBeenLastCalledWith("WEEKLY"));
    expect(within(group).getByRole("radio", { name: /Chaque semaine/ })).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    await waitFor(() => expect(api.updatePayoutSettings).toHaveBeenLastCalledWith("AT_DROP_OFF"));
    expect(within(group).getByRole("radio", { name: /Au dépôt/ })).toHaveAttribute("aria-checked", "true");
    await userEvent.keyboard("{ArrowLeft}");
    await waitFor(() => expect(api.updatePayoutSettings).toHaveBeenLastCalledWith("MONTHLY"));
  });

  it("refus du serveur : l'ancien choix revient et l'erreur est traduite", async () => {
    api.updatePayoutSettings.mockRejectedValue(new ApiError(400, "x", "invalid_payout_schedule"));
    renderPanel({ payoutSchedule: "MONTHLY" });
    const group = await screen.findByRole("radiogroup");
    await waitFor(() => expect(within(group).getByRole("radio", { name: /Chaque mois/ })).toHaveAttribute("aria-checked", "true"));
    await userEvent.click(within(group).getByRole("radio", { name: /Au dépôt/ }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Calendrier de reversement inconnu."));
    expect(within(group).getByRole("radio", { name: /Chaque mois/ })).toHaveAttribute("aria-checked", "true");
  });
});
