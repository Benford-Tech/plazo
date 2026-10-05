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
});
