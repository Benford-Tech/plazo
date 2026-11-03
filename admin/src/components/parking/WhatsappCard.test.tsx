import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { WhatsappSettings } from "@/lib/types";
import { WhatsappCard } from "./WhatsappCard";

const api = vi.hoisted(() => ({
  getWhatsappSettings: vi.fn(),
  updateWhatsappSettings: vi.fn(),
  testWhatsapp: vi.fn(),
}));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { role: "manager", demo: null } }),
}));

const base: WhatsappSettings = {
  available: true,
  enabled: false,
  smsFallback: true,
  month: { whatsapp: 0, read: 0, fallbacks: 0, failed: 0 },
};

const renderCard = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <WhatsappCard />
    </QueryClientProvider>,
  );

describe("WhatsappCard (03/11/2026)", () => {
  it("s'allume, dit le mois et envoie un test", async () => {
    api.getWhatsappSettings.mockResolvedValue(base);
    api.updateWhatsappSettings.mockResolvedValue({
      ...base,
      enabled: true,
      month: { whatsapp: 12, read: 9, fallbacks: 2, failed: 0 },
    });
    api.testWhatsapp.mockResolvedValue({ outcome: "sent" });
    renderCard();
    const toggle = await screen.findByTestId("whatsapp-toggle");
    expect(toggle).toHaveAttribute("aria-checked", "false");
    await userEvent.click(toggle);
    await waitFor(() => expect(api.updateWhatsappSettings).toHaveBeenCalledWith(true));
    expect(await screen.findByTestId("whatsapp-month")).toHaveTextContent(
      "Ce mois-ci : 12 par WhatsApp (9 lus), 2 par SMS en repli.",
    );
    await userEvent.type(screen.getByLabelText("Numéro de test"), "06 12 34 56 78");
    await userEvent.click(screen.getByRole("button", { name: "M'envoyer un test sur WhatsApp" }));
    await waitFor(() => expect(api.testWhatsapp).toHaveBeenCalledWith("+33612345678"));
  });

  it("sans numéro WhatsApp de Plazo : bientôt, interrupteur grisé ; sans SMS : prévient", async () => {
    api.getWhatsappSettings.mockResolvedValue({ ...base, available: false });
    const { unmount } = renderCard();
    expect(await screen.findByTestId("whatsapp-unavailable")).toBeInTheDocument();
    expect(screen.getByTestId("whatsapp-toggle")).toBeDisabled();
    unmount();
    api.getWhatsappSettings.mockResolvedValue({ ...base, enabled: true, smsFallback: false });
    renderCard();
    expect(await screen.findByTestId("whatsapp-no-fallback")).toBeInTheDocument();
  });
});
