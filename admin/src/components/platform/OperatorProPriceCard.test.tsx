import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PlatformProPrice } from "@/lib/api";
import { OperatorProPriceCard } from "./OperatorProPriceCard";

// 24/11/2026, « appliquer un tarif au plan mensuel d'un parking », direction A « Prix négocié ».
const api = vi.hoisted(() => ({ getOperatorProPrice: vi.fn(), setOperatorProPrice: vi.fn() }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const base: PlatformProPrice = {
  agreed: null,
  gridSetupFeeCents: 29000,
  vatPercent: 20,
  plans: [
    { id: "essentiel", name: "Essentiel", gridMonthlyCents: 14900 },
    { id: "operations", name: "Opérations", gridMonthlyCents: 29900 },
    { id: "complet", name: "Complet", gridMonthlyCents: 39900 },
  ],
  subscription: {
    status: "active",
    running: true,
    plan: "operations",
    yearly: false,
    priceCents: 29900,
    agreed: false,
    currentPeriodEnd: "2026-12-17T10:00:00Z",
  },
  setupFeePaid: true,
};

function renderCard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <OperatorProPriceCard operatorId="op_1" />
    </QueryClientProvider>,
  );
}

beforeEach(() => Object.values(api).forEach((fn) => fn.mockReset()));

describe("OperatorProPriceCard", () => {
  it("applique un prix convenu à la formule de l'abonnement, tout de suite", async () => {
    api.getOperatorProPrice.mockResolvedValue(base);
    api.setOperatorProPrice.mockResolvedValue({
      ...base,
      agreed: { plan: "operations", monthlyCents: 19950, gridMonthlyCents: 29900, setupFeeCents: 0 },
      subscription: { ...base.subscription!, priceCents: 19950, agreed: true },
      applied: true,
    });
    renderCard();
    expect(await screen.findByTestId("pro-price-current")).toHaveTextContent("Facturé 299,00 € HT");
    await userEvent.type(screen.getByTestId("pro-price-amount"), "199,50");
    await userEvent.click(screen.getByTestId("pro-price-setup-offered"));
    await userEvent.click(screen.getByLabelText("Maintenant (au prorata)"));
    await userEvent.click(screen.getByTestId("pro-price-apply"));
    expect(api.setOperatorProPrice).toHaveBeenCalledWith("op_1", {
      plan: "operations",
      monthlyCents: 19950,
      setupFeeCents: 0,
      when: "now",
    });
    await waitFor(() => expect(screen.getByTestId("pro-price-current")).toHaveTextContent("Tarif convenu"));
  });

  it("revient à la grille et refuse un montant illisible", async () => {
    api.getOperatorProPrice.mockResolvedValue({
      ...base,
      agreed: { plan: "operations", monthlyCents: 19900, gridMonthlyCents: 29900, setupFeeCents: null },
    });
    api.setOperatorProPrice.mockResolvedValue({ ...base, applied: true });
    renderCard();
    const amount = await screen.findByTestId("pro-price-amount");
    await waitFor(() => expect(amount).toHaveValue("199"));
    await userEvent.clear(amount);
    await userEvent.type(amount, "abc");
    await userEvent.click(screen.getByTestId("pro-price-apply"));
    expect(api.setOperatorProPrice).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId("pro-price-grid"));
    expect(api.setOperatorProPrice).toHaveBeenCalledWith("op_1", {
      plan: null,
      monthlyCents: null,
      setupFeeCents: null,
      when: "renewal",
    });
  });
});
