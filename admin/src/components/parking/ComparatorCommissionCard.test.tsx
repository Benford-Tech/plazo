import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { formatRate, parsePercent } from "@/lib/commission";
import { ComparatorCommissionCard } from "./ComparatorCommissionCard";

const api = vi.hoisted(() => ({ getComparatorCommissions: vi.fn(), setComparatorCommission: vi.fn(), removeComparatorCommission: vi.fn() }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const rate = (rateBp: number, effectiveFrom: string) => ({ comparatorKey: "allopark", label: "Allopark", rateBp, fixedCents: 0, effectiveFrom });

function renderCard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ComparatorCommissionCard />
    </QueryClientProvider>,
  );
}

describe("Ce que chaque comparateur vous prend (19/10/2026)", () => {
  it("lit et écrit un pourcentage", () => {
    expect(parsePercent("17,5")).toBe(1750);
    expect(parsePercent("18 %")).toBe(1800);
    expect(parsePercent("120")).toBeNull();
    expect(formatRate(1750)).toBe("17,5 %");
  });

  it("montre le taux en vigueur et celui à venir, et enregistre un taux à partir d'une date", async () => {
    api.getComparatorCommissions.mockResolvedValue({
      today: "2026-10-19",
      comparators: [
        { key: "allopark", label: "Allopark", current: rate(1800, "2026-10-01"), upcoming: [rate(2000, "2026-11-01")], history: [], bookingsThisMonth: 12 },
        { key: "onepark", label: "Onepark", current: null, upcoming: [], history: [], bookingsThisMonth: 0 },
      ],
    });
    api.setComparatorCommission.mockResolvedValue(rate(2500, "2026-10-19"));
    renderCard();
    expect(await screen.findByText("18 % depuis le 1 oct. 2026")).toBeInTheDocument();
    expect(screen.getByText("20 % à partir du 1 nov. 2026")).toBeInTheDocument();
    expect(screen.getByText(/Réservation de 54,00 €/)).toHaveTextContent("vous gardez 44,28 €");
    expect(screen.getByLabelText("Pourcentage de Allopark")).toHaveValue("18");

    const onepark = screen.getByLabelText("Pourcentage de Onepark");
    await userEvent.type(onepark, "2O");
    await userEvent.click(screen.getAllByRole("button", { name: "Enregistrer" })[1]);
    expect(await screen.findByRole("alert")).toHaveTextContent("Pourcentage invalide");
    await userEvent.clear(onepark);
    await userEvent.type(onepark, "25");
    await userEvent.type(screen.getByLabelText("Frais fixes par réservation de Onepark, en euros"), "1,50");
    await userEvent.click(screen.getAllByRole("button", { name: "Enregistrer" })[1]);
    await waitFor(() =>
      expect(api.setComparatorCommission).toHaveBeenCalledWith({ label: "Onepark", rateBp: 2500, fixedCents: 150, effectiveFrom: "2026-10-19" }),
    );
  });
});
