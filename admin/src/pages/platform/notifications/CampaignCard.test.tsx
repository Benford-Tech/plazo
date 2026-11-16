import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/lib/api";
import CampaignCard from "./CampaignCard";

const api = vi.hoisted(() => ({
  getTravellerCampaigns: vi.fn(),
  previewTravellerCampaign: vi.fn(),
  testTravellerCampaign: vi.fn(),
  startTravellerCampaign: vi.fn(),
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
      <CampaignCard />
    </QueryClientProvider>,
  );

describe("Mail aux voyageurs (15/11/2026, direction C)", () => {
  beforeEach(() => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    api.getAirports.mockResolvedValue([{ code: "LYS", name: "Lyon Saint-Exupéry", city: "Lyon", slug: "lyon-saint-exupery" }]);
    api.getTravellerCampaigns.mockResolvedValue({
      available: true,
      audience: 42,
      nextAt: null,
      from: "contact@plazo.fr",
      campaigns: [
        { id: "c1", subject: "Noël", airport: "lyon-saint-exupery", arrival: null, return: null, recipients: 30, sent: 12, failed: 1, skipped: 0, createdAt: "2026-11-01T09:00:00Z", finishedAt: null, by: "Joanny" },
      ],
    });
  });

  it("montre l'audience, l'aperçu et envoie après confirmation", async () => {
    const user = userEvent.setup();
    api.previewTravellerCampaign.mockResolvedValue({ subject: "s", html: "<p>Aperçu</p>", offers: 1 });
    api.startTravellerCampaign.mockResolvedValue({ id: "c2", recipients: 42, sent: 42 });
    renderIn();
    expect(await screen.findByText("42 voyageurs recevront ce mail.")).toBeInTheDocument();
    expect(screen.getByText("12 / 30 envoyés · 1 en échec · En cours")).toBeInTheDocument();
    await screen.findByRole("option", { name: "Lyon Saint-Exupéry" });
    await user.click(screen.getByTestId("campaign-preview"));
    expect(await screen.findByTestId("campaign-preview-frame")).toBeInTheDocument();
    expect(api.previewTravellerCampaign).toHaveBeenCalledWith(expect.objectContaining({ airport: "lyon-saint-exupery", arrival: null }));
    await user.click(screen.getByRole("button", { name: "Envoyer à 42 voyageurs" }));
    await waitFor(() => expect(api.startTravellerCampaign).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith("Envoi lancé à 42 voyageurs.");
  });

  it("bloque l'envoi pendant la semaine qui suit une campagne et dit les erreurs de champ", async () => {
    const user = userEvent.setup();
    api.getTravellerCampaigns.mockResolvedValue({ available: true, audience: 42, nextAt: "2026-11-22T09:00:00Z", from: null, campaigns: [] });
    api.testTravellerCampaign.mockRejectedValue(new ApiError(400, "bad", "validation_failed", { subject: "required" }));
    renderIn();
    expect(await screen.findByText(/Prochaine campagne possible le/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Envoyer à 42 voyageurs" })).toBeDisabled();
    await screen.findByRole("option", { name: "Lyon Saint-Exupéry" });
    await user.clear(screen.getByLabelText("Objet du mail"));
    await user.click(screen.getByTestId("campaign-test"));
    expect(await screen.findByTestId("campaign-error-subject")).toHaveTextContent("Obligatoire.");
  });
});
