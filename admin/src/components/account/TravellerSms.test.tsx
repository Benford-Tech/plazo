import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import type { SmsSettings, SmsStatus } from "@/lib/types";
import { TravellerSms } from "./TravellerSms";

const api = vi.hoisted(() => ({
  getSmsSettings: vi.fn(),
  updateSmsSettings: vi.fn(),
  testSms: vi.fn(),
  disableSms: vi.fn(),
  getSmsStatus: vi.fn(),
}));
const auth = vi.hoisted(() => ({ user: { role: "manager", viewAs: null } as Record<string, unknown> }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: auth.user }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    adminApi: { ...actual.adminApi, ...Object.fromEntries(Object.entries(api).map(([k, f]) => [k, (...a: unknown[]) => f(...a)])) },
  };
});

const unset: SmsSettings = { mode: "none", brevoAvailable: true, gateway: null };
const linked: SmsSettings = {
  mode: "gateway",
  brevoAvailable: true,
  gateway: { baseUrl: null, login: "AB12CD", senderPhone: "+33612345678", linkedAt: "2026-10-01T10:00:00.000Z" },
};
const status: SmsStatus = {
  mode: "gateway",
  brevoAvailable: true,
  linkedAt: "2026-10-01T10:00:00.000Z",
  lastSentAt: new Date(Date.now() - 12 * 60000).toISOString(),
  senderPhone: "+33612345678",
  month: { sent: 38, failed: 0 },
  pending: 0,
  pendingStale: false,
  lastError: null,
  lastErrorAt: null,
};

function renderPanel(settings: SmsSettings, s: Partial<SmsStatus> = {}) {
  api.getSmsSettings.mockResolvedValue(settings);
  api.getSmsStatus.mockResolvedValue({ ...status, ...s });
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <TravellerSms />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  Object.values(api).forEach(f => f.mockReset());
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.error).mockReset();
  auth.user = { role: "manager", viewAs: null };
});

describe("SMS aux voyageurs : avant liaison", () => {
  it("propose les trois canaux, les étapes et le formulaire du téléphone", async () => {
    renderPanel(unset);
    const box = await screen.findByTestId("sms-setup");
    expect(within(box).getByText("Envoi des SMS · à configurer")).toBeInTheDocument();
    expect(within(box).getByText("Envoyez les SMS depuis le téléphone de votre parking, gratuitement")).toBeInTheDocument();
    const radios = within(box).getAllByRole("radio");
    expect(radios.map(r => r.getAttribute("aria-checked"))).toEqual(["true", "false", "false"]);
    expect(radios[0]).toHaveTextContent("Téléphone du parking");
    expect(radios[1]).toHaveTextContent("Plazo envoie pour moi");
    expect(radios[2]).toHaveTextContent("Pas de SMS");
    expect(within(box).getByText("SMS Gateway for Android")).toBeInTheDocument();
    expect(within(box).getByLabelText("Identifiant affiché par l'appli")).toBeInTheDocument();
    expect(within(box).getByLabelText("Mot de passe affiché par l'appli")).toBeRequired();
    expect(within(box).getByLabelText("Numéro du téléphone (expéditeur)")).toBeInTheDocument();
    expect(within(box).getByLabelText("Envoyer un SMS de test à")).toBeInTheDocument();
    expect(within(box).getByRole("button", { name: "Relier et tester" })).toBeInTheDocument();
    expect(within(box).getByRole("button", { name: "Je n'ai pas de téléphone Android" })).toBeInTheDocument();
    expect(screen.getByText(/Tant que rien n'est configuré/)).toBeInTheDocument();
  });

  it("cache « Plazo envoie pour moi » quand la plateforme n'a pas Brevo", async () => {
    renderPanel({ ...unset, brevoAvailable: false });
    const box = await screen.findByTestId("sms-setup");
    expect(within(box).getAllByRole("radio")).toHaveLength(2);
    await userEvent.click(within(box).getByRole("button", { name: "Je n'ai pas de téléphone Android" }));
    expect(within(box).getByRole("radio", { name: /Pas de SMS/ })).toHaveAttribute("aria-checked", "true");
  });

  it("« Relier et tester » enregistre les identifiants (numéros en E.164) puis envoie le SMS de test", async () => {
    renderPanel(unset);
    api.updateSmsSettings.mockResolvedValue(linked);
    api.testSms.mockResolvedValue({ outcome: "queued" });
    const box = await screen.findByTestId("sms-setup");
    await userEvent.type(within(box).getByLabelText("Identifiant affiché par l'appli"), "AB12CD");
    await userEvent.type(within(box).getByLabelText("Mot de passe affiché par l'appli"), "s3cret");
    await userEvent.type(within(box).getByLabelText("Numéro du téléphone (expéditeur)"), "06 12 34 56 78");
    await userEvent.type(within(box).getByLabelText("Envoyer un SMS de test à"), "+33 6 98 76 54 32");
    await userEvent.click(within(box).getByRole("button", { name: "Relier et tester" }));

    await waitFor(() => expect(api.testSms).toHaveBeenCalledWith("+33698765432"));
    expect(api.updateSmsSettings).toHaveBeenCalledWith({ mode: "gateway", login: "AB12CD", password: "s3cret", senderPhone: "+33612345678", baseUrl: null });
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("transmis au téléphone pour +33 6 98 76 54 32"));
    // The linked state takes over.
    const after = await screen.findByTestId("sms-linked");
    expect(within(after).getByText("+33 6 12 34 56 78")).toBeInTheDocument();
  });

  it("le téléphone est relié même si le SMS de test échoue : l'erreur est dite, l'état relié montre la cause", async () => {
    renderPanel(unset, { lastError: "sms_gateway_unauthorized", lastErrorAt: new Date().toISOString() });
    api.updateSmsSettings.mockResolvedValue(linked);
    api.testSms.mockRejectedValue(new ApiError(502, "Test SMS failed", "sms_gateway_unauthorized"));
    const box = await screen.findByTestId("sms-setup");
    await userEvent.type(within(box).getByLabelText("Identifiant affiché par l'appli"), "AB12CD");
    await userEvent.type(within(box).getByLabelText("Mot de passe affiché par l'appli"), "s3cret");
    await userEvent.type(within(box).getByLabelText("Numéro du téléphone (expéditeur)"), "0612345678");
    await userEvent.type(within(box).getByLabelText("Envoyer un SMS de test à"), "0698765432");
    await userEvent.click(within(box).getByRole("button", { name: "Relier et tester" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("Identifiant ou mot de passe refusé")));
    const after = await screen.findByTestId("sms-linked");
    expect(await within(after).findByText(/Identifiant ou mot de passe refusé/)).toBeInTheDocument();
  });

  it("montre les erreurs de champ renvoyées par l'API", async () => {
    renderPanel(unset);
    api.updateSmsSettings.mockRejectedValue(new ApiError(400, "validation", "validation_failed", { senderPhone: "invalid_phone" }));
    const box = await screen.findByTestId("sms-setup");
    await userEvent.type(within(box).getByLabelText("Identifiant affiché par l'appli"), "AB12CD");
    await userEvent.type(within(box).getByLabelText("Mot de passe affiché par l'appli"), "s3cret");
    await userEvent.type(within(box).getByLabelText("Numéro du téléphone (expéditeur)"), "12");
    await userEvent.click(within(box).getByRole("button", { name: "Relier et tester" }));
    expect(await within(box).findByText("Numéro de téléphone invalide.")).toBeInTheDocument();
    expect(api.testSms).not.toHaveBeenCalled();
  });

  it("choisit « Plazo envoie pour moi » ou « Pas de SMS » sans formulaire", async () => {
    renderPanel(unset);
    api.updateSmsSettings.mockResolvedValue({ ...unset, mode: "brevo" });
    const box = await screen.findByTestId("sms-setup");
    await userEvent.click(within(box).getByRole("radio", { name: /Plazo envoie pour moi/ }));
    expect(within(box).queryByLabelText("Identifiant affiché par l'appli")).not.toBeInTheDocument();
    expect(within(box).getByText(/0,05 € par SMS décomptés/)).toBeInTheDocument();
    await userEvent.click(within(box).getByRole("button", { name: "Choisir" }));
    await waitFor(() => expect(api.updateSmsSettings).toHaveBeenCalledWith({ mode: "brevo" }));
    const channel = await screen.findByTestId("sms-channel");
    expect(within(channel).getByText("Envoi des SMS · Plazo envoie pour vous")).toBeInTheDocument();
  });
});

describe("SMS aux voyageurs : après liaison", () => {
  it("affiche l'état, l'expéditeur, les compteurs du mois et l'avertissement", async () => {
    renderPanel(linked);
    const box = await screen.findByTestId("sms-linked");
    expect(within(box).getByText("Envoi des SMS · téléphone du parking")).toBeInTheDocument();
    expect(await within(box).findByText(/Relié · dernier SMS envoyé il y a 12 min/)).toBeInTheDocument();
    expect(within(box).getByText("+33 6 12 34 56 78")).toBeInTheDocument();
    expect(within(box).getByText(/38 SMS envoyés ce mois · 0 échec/)).toBeInTheDocument();
    expect(within(box).getByRole("button", { name: "Envoyer un SMS de test" })).toBeInTheDocument();
    expect(within(box).getByRole("button", { name: "Modifier" })).toBeInTheDocument();
    expect(within(box).getByRole("button", { name: "Désactiver" })).toBeInTheDocument();
    expect(within(box).getByText(/mis en attente 2 h puis abandonnés/)).toBeInTheDocument();
    expect(screen.queryByText(/Tant que rien n'est configuré/)).not.toBeInTheDocument();
  });

  it("signale les SMS en attente quand le téléphone ne répond plus", async () => {
    renderPanel(linked, { pending: 3, pendingStale: true, month: { sent: 5, failed: 2 } });
    const box = await screen.findByTestId("sms-linked");
    expect(await within(box).findByText(/5 SMS envoyés ce mois · 2 échecs · 3 en attente · téléphone injoignable/)).toBeInTheDocument();
  });

  it("envoie un SMS de test depuis l'état relié", async () => {
    renderPanel(linked);
    api.testSms.mockResolvedValue({ outcome: "sent" });
    const box = await screen.findByTestId("sms-linked");
    await userEvent.click(within(box).getByRole("button", { name: "Envoyer un SMS de test" }));
    await userEvent.type(within(box).getByLabelText("Numéro qui recevra le SMS de test"), "06 98 76 54 32");
    await userEvent.click(within(box).getByRole("button", { name: "Envoyer" }));
    await waitFor(() => expect(api.testSms).toHaveBeenCalledWith("+33698765432"));
    expect(toast.success).toHaveBeenCalledWith("SMS de test envoyé à +33 6 98 76 54 32 : vérifiez sa réception.");
    expect(within(box).queryByLabelText("Numéro qui recevra le SMS de test")).not.toBeInTheDocument();
  });

  it("« Modifier » rouvre le formulaire avec l'identifiant et le numéro, sans redemander le mot de passe", async () => {
    renderPanel(linked);
    api.updateSmsSettings.mockResolvedValue({ ...linked, gateway: { ...linked.gateway!, senderPhone: "+33698765432" } });
    await userEvent.click(await screen.findByRole("button", { name: "Modifier" }));
    const box = await screen.findByTestId("sms-setup");
    expect(within(box).getByLabelText("Identifiant affiché par l'appli")).toHaveValue("AB12CD");
    expect(within(box).getByLabelText("Numéro du téléphone (expéditeur)")).toHaveValue("+33 6 12 34 56 78");
    expect(within(box).getByLabelText("Mot de passe affiché par l'appli")).not.toBeRequired();
    expect(within(box).getByText("Laissez vide pour garder celui enregistré.")).toBeInTheDocument();
    await userEvent.clear(within(box).getByLabelText("Numéro du téléphone (expéditeur)"));
    await userEvent.type(within(box).getByLabelText("Numéro du téléphone (expéditeur)"), "0698765432");
    await userEvent.click(within(box).getByRole("button", { name: "Relier et tester" }));
    await waitFor(() => expect(api.updateSmsSettings).toHaveBeenCalledWith({ mode: "gateway", login: "AB12CD", senderPhone: "+33698765432", baseUrl: null }));
    expect(api.testSms).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Téléphone relié");
    expect(await screen.findByTestId("sms-linked")).toBeInTheDocument();
  });

  it("« Désactiver » demande confirmation puis revient à l'état à configurer", async () => {
    renderPanel(linked);
    api.disableSms.mockResolvedValue(unset);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await userEvent.click(await screen.findByRole("button", { name: "Désactiver" }));
    await waitFor(() => expect(api.disableSms).toHaveBeenCalled());
    expect(await screen.findByTestId("sms-setup")).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("SMS désactivés");
    vi.restoreAllMocks();
  });
});

describe("SMS aux voyageurs : accès", () => {
  it("n'apparaît pas pour un agent", async () => {
    auth.user = { role: "agent", viewAs: null };
    renderPanel(linked);
    await new Promise(r => setTimeout(r, 20));
    expect(screen.queryByText("SMS aux voyageurs")).not.toBeInTheDocument();
    expect(api.getSmsSettings).not.toHaveBeenCalled();
  });

  it("en consultation (super admin) : lecture seule, aucun bouton", async () => {
    auth.user = { role: "manager", viewAs: { operatorId: "o1", operatorName: "Loueur" } };
    renderPanel(linked);
    const box = await screen.findByTestId("sms-linked");
    expect(within(box).getByText(/Consultation : seul le loueur/)).toBeInTheDocument();
    expect(within(box).queryByRole("button")).not.toBeInTheDocument();
  });
});
