import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmProvider } from "@/components/ui/confirm";
import type { WebsiteIntegration } from "@/lib/types";
import { WebsiteIntegrationCard } from "./WebsiteIntegrationCard";

// Site du parking (19/11/2026, niveau 2). Fictional site only.

const api = vi.hoisted(() => ({ getWebsiteIntegration: vi.fn(), createWebsiteKey: vi.fn(), removeWebsiteKey: vi.fn() }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { demo: null } }) }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const none: WebsiteIntegration = {
  connected: false,
  keyPrefix: null,
  createdAt: null,
  lastUsedAt: null,
  lastBookingAt: null,
  siteHost: null,
  pluginVersion: "1.0.0",
};

const renderCard = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ConfirmProvider>
        <WebsiteIntegrationCard />
      </ConfirmProvider>
    </QueryClientProvider>,
  );

describe("Site du parking", () => {
  it("crée la clé, la montre une fois, puis le site relié", async () => {
    const user = userEvent.setup();
    api.getWebsiteIntegration.mockResolvedValue({ data: none });
    api.createWebsiteKey.mockResolvedValue({
      data: { ...none, connected: true, keyPrefix: "plz_site_AbCdEf", key: "plz_site_AbCdEf123456789012345678901234" },
    });
    renderCard();
    expect(await screen.findByText("Pas encore relié")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Télécharger l'extension (v1.0.0)" })).toHaveAttribute(
      "href",
      expect.stringContaining("/public/site/wordpress-plugin.zip"),
    );
    await user.click(screen.getByTestId("website-create"));
    expect(await screen.findByTestId("website-key")).toHaveTextContent("plz_site_AbCdEf123456789012345678901234");
    expect(screen.getByText("Clé créée, en attente du site")).toBeInTheDocument();
  });

  it("le site qui réserve et la nouvelle clé confirmée", async () => {
    const user = userEvent.setup();
    api.getWebsiteIntegration.mockResolvedValue({
      data: { ...none, connected: true, keyPrefix: "plz_site_AbCdEf", lastUsedAt: "2026-11-19T09:00:00Z", lastBookingAt: "2026-11-19T09:42:00Z", siteHost: "parking-des-cedres.example" },
    });
    api.createWebsiteKey.mockResolvedValue({ data: { ...none, connected: true, keyPrefix: "plz_site_ZzZzZz", key: "plz_site_ZzZzZz999" } });
    renderCard();
    expect(await screen.findByText("Relié")).toBeInTheDocument();
    expect(screen.getByTestId("website-line")).toHaveTextContent("parking-des-cedres.example · dernière réservation reçue le");
    expect(screen.getByText("Clé plz_site_AbCdEf…")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Nouvelle clé" }));
    const dialog = await screen.findByRole("alertdialog").catch(() => screen.findByRole("dialog"));
    await user.click(within(dialog).getByRole("button", { name: "Nouvelle clé" }));
    await waitFor(() => expect(api.createWebsiteKey).toHaveBeenCalled());
  });
});
