import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { WhatsappNumber, WhatsappSettings } from "@/lib/types";
import { WhatsappCard } from "./WhatsappCard";

const api = vi.hoisted(() => ({
  getWhatsappSettings: vi.fn(),
  updateWhatsappSettings: vi.fn(),
  testWhatsapp: vi.fn(),
  requestWhatsappNumber: vi.fn(),
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
  enabled: true,
  smsFallback: true,
  month: { whatsapp: 0, read: 0, fallbacks: 0, failed: 0 },
  number: null,
};
const number = (patch: Partial<WhatsappNumber>): WhatsappNumber => ({
  status: "requested",
  phone: null,
  phoneNumberId: null,
  displayName: "Plazo",
  nameStatus: null,
  metaStatus: null,
  quality: null,
  requestedAt: "2026-11-14T09:00:00Z",
  codeSentAt: null,
  registeredAt: null,
  activeAt: null,
  checkedAt: null,
  lastError: null,
  sending: false,
  ...patch,
});
const renderCard = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <WhatsappCard />
    </QueryClientProvider>,
  );

describe("WhatsappNumberCard (14/11/2026, un numéro WhatsApp par parking)", () => {
  it("le parking demande son numéro, puis voit la demande en cours", async () => {
    api.getWhatsappSettings.mockResolvedValue(base);
    api.requestWhatsappNumber.mockResolvedValue(number({}));
    renderCard();
    await userEvent.click(await screen.findByTestId("whatsapp-number-request"));
    await waitFor(() => expect(api.requestWhatsappNumber).toHaveBeenCalled());
    expect(await screen.findByText("Numéro demandé")).toBeInTheDocument();
  });

  it("numéro en revue chez Meta, puis actif", async () => {
    api.getWhatsappSettings.mockResolvedValue({
      ...base,
      number: number({ status: "registered", phone: "06 39 98 12 40", nameStatus: "PENDING_REVIEW" }),
    });
    const { unmount } = renderCard();
    expect(await screen.findByText("Votre numéro WhatsApp · 06 39 98 12 40")).toBeInTheDocument();
    expect(screen.getByText("Nom affiché « Plazo » · en revue chez Meta")).toBeInTheDocument();
    expect(screen.getByText("En cours")).toBeInTheDocument();
    unmount();
    api.getWhatsappSettings.mockResolvedValue({
      ...base,
      number: number({ status: "active", phone: "06 39 98 12 40", nameStatus: "APPROVED", sending: true }),
    });
    renderCard();
    expect(await screen.findByText("Actif", { selector: "span.shrink-0" })).toBeInTheDocument();
    expect(screen.getByText("Nom affiché « Plazo »")).toBeInTheDocument();
  });

  it("rien pour une ancienne API sans le champ", async () => {
    const { number: _drop, ...old } = base;
    api.getWhatsappSettings.mockResolvedValue(old);
    renderCard();
    await screen.findByTestId("whatsapp-toggle");
    expect(screen.queryByTestId("whatsapp-number")).toBeNull();
  });
});
