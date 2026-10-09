import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { RevenueReport } from "@/lib/types";
import RevenuePage from "./RevenuePage";

const api = vi.hoisted(() => ({
  getRevenue: vi.fn(),
  exportRevenue: vi.fn(),
  setReservationPrice: vi.fn(),
}));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const days = (from: string, n: number) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date(`${from}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + i);
    return { date: d.toISOString().slice(0, 10), count: 0, totalCents: 0 };
  });

const report = (over: Partial<RevenueReport> = {}): RevenueReport => ({
  from: "2026-10-01",
  to: "2026-10-31",
  basis: "arrival",
  timezone: "Europe/Paris",
  totalCents: 481250,
  count: 109,
  averageCents: 4415,
  averageDays: 5.2,
  withoutAmount: 2,
  byChannel: [
    { channel: "aggregator", detail: "Allopark", count: 41, totalCents: 164000 },
    { channel: "plazo", detail: null, count: 9, totalCents: 51350 },
  ],
  byDay: days("2026-10-01", 31).map(d => (d.date === "2026-10-09" ? { ...d, count: 3, totalCents: 12300 } : d)),
  missing: [
    { id: "r1", reference: "R7KQ2M", customerName: "Léa Petit", arrivalAt: "2026-10-09T17:45:00Z", channel: "phone", detail: null },
    { id: "r2", reference: "R8ZZ9A", customerName: "Marc Leroy", arrivalAt: "2026-10-08T06:00:00Z", channel: "counter", detail: null },
  ],
  ...over,
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <RevenuePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("RevenuePage (CA-B, 09/10/2026)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-09T10:00:00Z"));
    api.getRevenue.mockReset().mockResolvedValue(report());
    api.exportRevenue.mockReset();
    api.setReservationPrice.mockReset().mockResolvedValue({ id: "r1", priceCents: 4500 });
  });
  afterEach(() => vi.useRealTimers());

  it("ouvre sur le mois en cours, par jour d’arrivée : total, réservations, panier moyen, canaux et jours", async () => {
    renderPage();
    expect(await screen.findByTestId("revenue-total")).toHaveTextContent("Total octobre");
    expect(api.getRevenue).toHaveBeenCalledWith("2026-10-01", "2026-10-31", "arrival");
    expect(screen.getByTestId("revenue-total")).toHaveTextContent(/4\s812,50\s€/);
    expect(screen.getByTestId("revenue-count")).toHaveTextContent("109");
    expect(screen.getByText("dont 2 sans montant")).toBeInTheDocument();
    expect(screen.getByText("5,2 jours en moyenne")).toBeInTheDocument();
    const table = screen.getByRole("table");
    expect(within(table).getByRole("rowheader", { name: "Allopark" })).toBeInTheDocument();
    expect(within(table).getByRole("rowheader", { name: "Plazo" })).toBeInTheDocument();
    // Once in the share column, once under the amount on phones.
    expect(within(table).getAllByText("34 %")).toHaveLength(2);
    expect(within(screen.getByTestId("revenue-days")).getAllByRole("listitem")).toHaveLength(31);
    expect(screen.getByText(/9 oct\. : 123,00\s€, 3 réservations/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Octobre" })).toHaveAttribute("aria-pressed", "true");
  });

  it("change de période et de mode de comptage", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByTestId("revenue-total");
    await user.click(screen.getByRole("button", { name: "7 jours" }));
    await waitFor(() => expect(api.getRevenue).toHaveBeenLastCalledWith("2026-10-03", "2026-10-09", "arrival"));
    await user.click(screen.getByRole("button", { name: "Septembre" }));
    await waitFor(() => expect(api.getRevenue).toHaveBeenLastCalledWith("2026-09-01", "2026-09-30", "arrival"));
    await user.click(screen.getByRole("button", { name: "jour de réservation" }));
    await waitFor(() => expect(api.getRevenue).toHaveBeenLastCalledWith("2026-09-01", "2026-09-30", "booked"));
    await user.click(screen.getByRole("button", { name: "Dates…" }));
    await user.clear(screen.getByLabelText("Du"));
    await user.type(screen.getByLabelText("Du"), "2026-08-15");
    await user.click(screen.getByRole("button", { name: "Afficher" }));
    await waitFor(() => expect(api.getRevenue).toHaveBeenLastCalledWith("2026-08-15", "2026-10-09", "booked"));
  });

  it("fait compléter les réservations sans montant, une par une", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("button", { name: "Les compléter" }));
    const missing = screen.getByTestId("revenue-missing");
    expect(within(missing).getByText("Léa Petit")).toBeInTheDocument();
    await user.type(within(missing).getByLabelText("Montant de R7KQ2M en euros"), "45");
    await user.click(within(missing).getAllByRole("button", { name: "Enregistrer" })[0]);
    expect(api.setReservationPrice).toHaveBeenCalledWith("r1", 4500);
    await waitFor(() => expect(api.getRevenue).toHaveBeenCalledTimes(2));
  });

  it("exporte le CSV de la période", async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn(() => "blob:csv");
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    api.exportRevenue.mockResolvedValue({ blob: new Blob(["x"]), filename: "chiffre-affaires_2026-10-01_2026-10-31.csv" });
    renderPage();
    await user.click(await screen.findByRole("button", { name: "Exporter en CSV" }));
    expect(api.exportRevenue).toHaveBeenCalledWith("2026-10-01", "2026-10-31", "arrival");
    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(createObjectURL).toHaveBeenCalled();
    click.mockRestore();
  });

  it("le dit quand rien n’a de montant sur la période", async () => {
    api.getRevenue.mockResolvedValue(report({ totalCents: 0, count: 0, averageCents: null, averageDays: null, withoutAmount: 0, byChannel: [], missing: [] }));
    renderPage();
    expect(await screen.findByText("Aucune réservation avec un montant sur cette période.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Les compléter" })).not.toBeInTheDocument();
  });
});
