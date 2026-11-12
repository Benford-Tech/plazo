import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ChannelProfit, RevenueChannels } from "@/lib/types";
import StatsPage from "./StatsPage";

const api = vi.hoisted(() => ({ getRevenueChannels: vi.fn() }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const line = (over: Partial<ChannelProfit>): ChannelProfit => ({
  channel: "aggregator",
  detail: null,
  comparatorKey: null,
  rateBp: null,
  missingRate: false,
  count: 0,
  totalCents: 0,
  commissionCents: 0,
  netCents: 0,
  netPerBookingCents: null,
  monthlyNetCents: Array(12).fill(0),
  ...over,
});

const data = (over: Partial<RevenueChannels> = {}): RevenueChannels => ({
  today: "2026-11-12",
  basis: "arrival",
  months: Array.from({ length: 12 }, (_, i) => ({
    month: `2026-${String(i + 1).padStart(2, "0")}`,
    from: "",
    to: "",
    totalCents: 10000,
    commissionCents: 1000,
    netCents: 9000,
    count: 2,
    withoutAmount: 0,
  })),
  channels: [
    line({ channel: "phone", count: 4, totalCents: 24000, netCents: 24000, netPerBookingCents: 6000 }),
    line({ detail: "Allopark", comparatorKey: "allopark", rateBp: 1800, count: 5, totalCents: 25000, commissionCents: 4500, netCents: 20500, netPerBookingCents: 4100 }),
    line({ detail: "Parclick", comparatorKey: "parclick", missingRate: true, count: 2, totalCents: 8000 }),
  ],
  withoutAmount: 3,
  ...over,
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <StatsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("StatsPage (« Quelles plateformes vous rapportent », 12/11/2026)", () => {
  beforeEach(() => {
    localStorage.clear();
    api.getRevenueChannels.mockReset().mockResolvedValue(data());
  });

  it("lists each channel with its net, the one without a rate apart, and the months", async () => {
    renderPage();
    const allopark = await screen.findByTestId("stats-channel-Allopark");
    expect(allopark).toHaveTextContent("Allopark");
    expect(allopark).toHaveTextContent("18");
    expect(allopark).toHaveTextContent("205,00");
    const parclick = screen.getByTestId("stats-channel-Parclick");
    expect(parclick).toHaveTextContent("taux à régler");
    expect(within(parclick).getAllByRole("link", { name: "Régler la commission" })[0]).toHaveAttribute("href", "/parking/reglages");
    expect(within(screen.getByTestId("stats-months")).getAllByRole("img")).toHaveLength(12);
  });

  it("says which channel pays the most per booking, which has no rate, and the bookings without a price", async () => {
    renderPage();
    const takeaways = await screen.findByTestId("stats-takeaways");
    expect(takeaways).toHaveTextContent("Téléphone rapporte le plus par réservation");
    expect(takeaways).toHaveTextContent("contre 41,00");
    expect(takeaways).toHaveTextContent("Parclick : pas de taux");
    expect(takeaways).toHaveTextContent("3 réservations sans prix");
    expect(within(takeaways).getByRole("link", { name: "Les compléter" })).toHaveAttribute("href", "/reservations?sansprix=1");
  });

  it("asks nothing while the platform admin hides the revenue on this browser", async () => {
    localStorage.setItem("plazo:revenue-hidden", "1");
    renderPage();
    expect(await screen.findByTestId("stats-hidden")).toBeInTheDocument();
    expect(api.getRevenueChannels).not.toHaveBeenCalled();
  });
});
