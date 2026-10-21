import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ExtraSettings, Parking } from "@/lib/types";
import { ExtrasSettingsCard } from "./ExtrasSettingsCard";

const api = vi.hoisted(() => ({ getExtraSettings: vi.fn(), updateExtraSettings: vi.fn() }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const parking = { id: "p1", name: "Parking du Rhône" } as Parking;
const settings: ExtraSettings = {
  leadHours: 24,
  offers: [
    { kind: "interior_wash", label: "Lavage intérieur et shampouineuse", description: "Aspiration", enabled: false, priceCents: 5000, defaultPriceCents: 5000 },
    { kind: "hybrid_charge", label: "Recharge hybride", description: "Batterie", enabled: false, priceCents: 1500, defaultPriceCents: 1500 },
    { kind: "ev_charge", label: "Recharge électrique", description: "Recharge", enabled: true, priceCents: 3000, defaultPriceCents: 3000 },
  ],
};

const renderCard = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ExtrasSettingsCard parking={parking} />
    </QueryClientProvider>,
  );

describe("ExtrasSettingsCard (services additionnels)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getExtraSettings.mockResolvedValue(settings);
    api.updateExtraSettings.mockImplementation(async (_id: string, body: { leadHours: number }) => ({ ...settings, leadHours: body.leadHours }));
  });

  it("montre les trois services et enregistre les prix en centimes", async () => {
    renderCard();
    const wash = await screen.findByTestId("extra-interior_wash");
    expect(within(wash).getByRole("switch")).toHaveAttribute("aria-checked", "false");
    expect(within(screen.getByTestId("extra-ev_charge")).getByRole("switch")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText(/Commission Plazo prise sur chaque service/)).toBeInTheDocument();

    await userEvent.click(within(wash).getByRole("switch"));
    const price = within(wash).getByLabelText("Prix : Lavage intérieur et shampouineuse");
    await userEvent.clear(price);
    await userEvent.type(price, "45,5");
    const hours = screen.getByLabelText("Commande possible jusqu'à");
    await userEvent.clear(hours);
    await userEvent.type(hours, "12");
    await userEvent.click(screen.getByTestId("extras-save"));
    await waitFor(() =>
      expect(api.updateExtraSettings).toHaveBeenCalledWith("p1", {
        leadHours: 12,
        offers: [
          { kind: "interior_wash", enabled: true, priceCents: 4550 },
          { kind: "hybrid_charge", enabled: false, priceCents: 1500 },
          { kind: "ev_charge", enabled: true, priceCents: 3000 },
        ],
      }),
    );
  });

  it("refuse un prix hors limites sans appeler l'API", async () => {
    renderCard();
    const wash = await screen.findByTestId("extra-interior_wash");
    const price = within(wash).getByLabelText("Prix : Lavage intérieur et shampouineuse");
    await userEvent.clear(price);
    await userEvent.type(price, "0,50");
    await userEvent.click(screen.getByTestId("extras-save"));
    expect(await screen.findByText("Entre 1 € et 1 000 €.")).toBeInTheDocument();
    expect(api.updateExtraSettings).not.toHaveBeenCalled();
  });
});
