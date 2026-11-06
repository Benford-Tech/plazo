import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PlatformSeo } from "@/lib/types";
import SeoPage from "./SeoPage";

const api = vi.hoisted(() => ({ getPlatformSeo: vi.fn() }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, getPlatformSeo: (d: number) => api.getPlatformSeo(d) } };
});

const report = (over: Partial<PlatformSeo["searchConsole"]> = {}): PlatformSeo => ({
  from: "2026-10-08",
  to: "2026-11-06",
  days: 30,
  bookings: {
    total: 10,
    revenueCents: 60000,
    search: { count: 4, revenueCents: 24000 },
    bySource: [
      { source: "search", detail: "google", count: 4, revenueCents: 24000 },
      { source: "unknown", detail: "", count: 6, revenueCents: 36000 },
    ],
  },
  visits: { total: 900, search: 410 },
  pages: [{ landing: "/lyon-saint-exupery/depuis/grenoble", visits: 74, searchVisits: 60, bookings: 3, revenueCents: 17100 }],
  searchConsole: {
    configured: true,
    lastSyncAt: "2026-11-06T01:00:00Z",
    lastDate: "2026-11-04",
    lastError: null,
    property: "sc-domain:plazo.fr",
    totals: { clicks: 120, impressions: 5400, position: 11.2 },
    queries: [{ query: "parking aéroport lyon", page: "/", clicks: 96, impressions: 3000, position: 8.4, previous: 10.4 }],
    pages: [{ page: "/", clicks: 96, impressions: 3000, position: 8.4, previous: 10.4 }],
    ...over,
  },
});

function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <SeoPage />
    </QueryClientProvider>,
  );
}

describe("Plateforme › Référencement (06/11/2026)", () => {
  beforeEach(() => api.getPlatformSeo.mockReset().mockResolvedValue(report()));

  it("montre les réservations venues des moteurs, les pages d'entrée et les positions", async () => {
    show();
    const kpis = await screen.findByTestId("seo-kpis");
    expect(kpis).toHaveTextContent("4");
    expect(kpis).toHaveTextContent("40 %");
    expect(screen.getByTestId("seo-sources")).toHaveTextContent("Moteur de recherche · google");
    expect(screen.getByTestId("seo-sources")).toHaveTextContent("Non mesuré");
    expect(within(screen.getByTestId("seo-pages")).getByText("/lyon-saint-exupery/depuis/grenoble")).toBeInTheDocument();
    const gsc = screen.getByTestId("seo-gsc");
    expect(gsc).toHaveTextContent("parking aéroport lyon");
    expect(gsc).toHaveTextContent("↑2,0");
    expect(api.getPlatformSeo).toHaveBeenCalledWith(30);
    await userEvent.click(screen.getByTestId("seo-period-90"));
    expect(api.getPlatformSeo).toHaveBeenCalledWith(90);
  });

  it("explique comment relier la Search Console tant qu'elle ne l'est pas", async () => {
    api.getPlatformSeo.mockResolvedValue(report({ configured: false, totals: null, queries: [], pages: [], lastDate: null }));
    show();
    expect(await screen.findByTestId("seo-gsc-off")).toHaveTextContent("GOOGLE_SEARCH_CONSOLE_CREDENTIALS");
  });
});
