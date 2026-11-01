import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import ForecastPage from "./ForecastPage";

const api = vi.hoisted(() => ({ getPlanningForecast: vi.fn() }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, getPlanningForecast: (...a: unknown[]) => api.getPlanningForecast(...a) } };
});

const day = (date: string, arrivals: number, returns: number, parked: number) => ({
  date,
  arrivals,
  returns,
  parked,
  bookable: 100,
  free: 100 - parked,
  overbooked: parked > 100,
});

function Where() {
  const location = useLocation();
  return <p data-testid="where">{location.pathname + location.search}</p>;
}

function renderAt(url: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/planning/previsionnel" element={<ForecastPage />} />
          <Route path="/planning" element={<Where />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Planning prévisionnel (direction A)", () => {
  beforeEach(() => {
    api.getPlanningForecast.mockImplementation((from: string, days: number) =>
      Promise.resolve({
        today: "2026-10-28",
        timezone: "Europe/Paris",
        from,
        to: from,
        bookableCapacity: 100,
        days: Array.from({ length: days }, (_, i) => {
          const date = new Date(Date.parse(`${from}T00:00:00Z`) + i * 86_400_000).toISOString().slice(0, 10);
          if (date === "2026-10-30") return day(date, 14, 9, 100);
          if (date === "2026-10-29") return day(date, 6, 3, 90);
          return day(date, 1, 1, 40);
        }),
      }),
    );
  });

  it("montre le mois, les arrivées, les départs, la jauge et « Complet »", async () => {
    renderAt("/planning/previsionnel?date=2026-10-28");
    const full = await screen.findByTestId("forecast-day-2026-10-30");
    expect(api.getPlanningForecast).toHaveBeenCalledWith("2026-10-01", 31);
    expect(full).toHaveTextContent("↑14");
    expect(full).toHaveTextContent("↓9");
    expect(full).toHaveTextContent("Complet");
    expect(screen.getByTestId("forecast-day-2026-10-29")).toHaveTextContent("90 %");
    expect(screen.getByTestId("forecast-day-2026-10-27").className).toContain("opacity-45");
    expect(screen.getByTestId("forecast-summary")).toHaveTextContent("1 nuit complète");
  });

  it("montre le nombre de voitures garées la nuit de chaque jour", async () => {
    renderAt("/planning/previsionnel?date=2026-10-28");
    await screen.findByTestId("forecast-day-2026-10-30");
    expect(screen.getByTestId("forecast-parked-2026-10-29")).toHaveTextContent("90");
    expect(screen.getByTestId("forecast-parked-2026-10-29")).toHaveAttribute("title", "90 voitures garées la nuit");
    expect(screen.getByTestId("forecast-day-2026-10-29")).toHaveAccessibleName(expect.stringContaining("90 voitures garées la nuit"));
    expect(screen.getByTestId("forecast-summary")).toHaveTextContent("Jusqu'à 100 voitures");
    expect(screen.getByText("Voitures garées la nuit")).toBeInTheDocument();
  });

  it("passe en trois mois et ouvre le planning d’un jour", async () => {
    renderAt("/planning/previsionnel?date=2026-10-28");
    await screen.findByTestId("forecast-day-2026-10-30");
    await userEvent.click(screen.getByRole("button", { name: "3 mois" }));
    expect(api.getPlanningForecast).toHaveBeenLastCalledWith("2026-10-01", 92);
    await userEvent.click(await screen.findByTestId("forecast-day-2026-12-03"));
    expect(screen.getByTestId("where")).toHaveTextContent("/planning?date=2026-12-03");
  });
});
