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
    expect(screen.getByText(/Réservation de 60,00 €/)).toHaveTextContent("vous gardez 49,20 €");
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
      expect(api.setComparatorCommission).toHaveBeenCalledWith({ label: "Onepark", rateBp: 2500, fixedCents: 150, vatBp: 0, effectiveFrom: "2026-10-19" }),
    );
  });

  it("TVA sur la commission (23/11/2026, choix A) : choisie avec le taux, l'exemple la montre", async () => {
    api.getComparatorCommissions.mockResolvedValue({
      today: "2026-11-23",
      comparators: [
        { key: "allopark", label: "Allopark", current: { ...rate(1800, "2026-10-01"), vatBp: 2000 }, upcoming: [], history: [], bookingsThisMonth: 3 },
        { key: "onepark", label: "Onepark", current: rate(2000, "2026-10-01"), upcoming: [], history: [], bookingsThisMonth: 1 },
      ],
    });
    api.setComparatorCommission.mockResolvedValue(rate(2000, "2026-11-23"));
    renderCard();
    expect(await screen.findByText("18 % + TVA 20 % depuis le 1 oct. 2026")).toBeInTheDocument();
    expect(screen.getByText(/Allopark, réservation de 60,00 €/)).toHaveTextContent("10,80 € HT + TVA 20 % 2,16 € = 12,96 € TTC. Vous gardez 47,04 €");
    const onepark = screen.getByTestId("vat-onepark");
    expect(onepark.querySelector('[aria-pressed="true"]')).toHaveTextContent("Aucune");
    await userEvent.click(screen.getAllByRole("button", { name: "Autre…" })[1]);
    await userEvent.type(screen.getByLabelText("Taux de TVA sur la commission de Onepark"), "5,5");
    await userEvent.click(screen.getAllByRole("button", { name: "Enregistrer" })[1]);
    await waitFor(() =>
      expect(api.setComparatorCommission).toHaveBeenCalledWith({ label: "Onepark", rateBp: 2000, fixedCents: 0, vatBp: 550, effectiveFrom: "2026-11-23" }),
    );
  });
});
