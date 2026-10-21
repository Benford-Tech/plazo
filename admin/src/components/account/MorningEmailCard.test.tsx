import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MorningEmailCard } from "./MorningEmailCard";

const api = vi.hoisted(() => ({ getMorningEmail: vi.fn(), updateMorningEmail: vi.fn(), sendMorningEmail: vi.fn() }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...Object.fromEntries(Object.entries(api).map(([k, f]) => [k, (...a: unknown[]) => f(...a)])) } };
});
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { role: "manager" } }) }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const renderCard = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MorningEmailCard />
    </QueryClientProvider>,
  );

describe("MorningEmailCard", () => {
  beforeEach(() => {
    Object.values(api).forEach(f => f.mockReset());
    toast.success.mockReset();
    api.getMorningEmail.mockResolvedValue({ enabled: true, hour: 7, email: "claire@exemple.fr" });
  });

  it("coupe le mail et change l'heure", async () => {
    api.updateMorningEmail.mockImplementation(async (patch: { enabled?: boolean; hour?: number }) => ({ enabled: patch.enabled ?? true, hour: patch.hour ?? 7, email: "claire@exemple.fr" }));
    renderCard();
    const toggle = await screen.findByRole("switch", { name: "Mail du matin" });
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("claire@exemple.fr")).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText("Heure d'envoi"), "8");
    expect(api.updateMorningEmail).toHaveBeenCalledWith({ hour: 8 });
    await userEvent.click(toggle);
    expect(api.updateMorningEmail).toHaveBeenLastCalledWith({ enabled: false });
    await waitFor(() => expect(screen.getByRole("switch", { name: "Mail du matin" })).toHaveAttribute("aria-checked", "false"));
    expect(toast.success).toHaveBeenCalledWith("Mail du matin coupé.");
  });

  it("envoie celui d'aujourd'hui", async () => {
    api.sendMorningEmail.mockResolvedValue({ sent: true });
    renderCard();
    await userEvent.click(await screen.findByRole("button", { name: "M'envoyer celui d'aujourd'hui" }));
    expect(api.sendMorningEmail).toHaveBeenCalled();
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Mail envoyé : il arrive dans quelques instants."));
  });
});
