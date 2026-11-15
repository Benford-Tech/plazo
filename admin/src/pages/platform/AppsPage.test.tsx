import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PlatformApps } from "@/lib/types";
import AppsPage, { trend } from "./AppsPage";

const api = vi.hoisted(() => ({ getPlatformApps: vi.fn() }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, getPlatformApps: (d: number) => api.getPlatformApps(d) } };
});

const report = (over: Partial<PlatformApps> = {}): PlatformApps => ({
  days: 30,
  from: "2026-10-17",
  to: "2026-11-15",
  plazo: {
    installs: 142,
    installsBefore: 120,
    activeToday: 37,
    active7: 211,
    active30: 498,
    phones: 640,
    platforms: [
      { platform: "ios", count: 289 },
      { platform: "android", count: 209 },
    ],
    bookings: 64,
    bookingsCents: 384000,
  },
  pro: { activeToday: 12, active7: 23, active30: 29, members: 31, activeOperators7: 6, operators: 7 },
  series: [
    { date: "2026-11-14", installs: 5, plazoActive: 30, proActive: 10 },
    { date: "2026-11-15", installs: 7, plazoActive: 37, proActive: 12 },
  ],
  measuredSince: "2026-11-15",
  ...over,
});

function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AppsPage />
    </QueryClientProvider>,
  );
}

describe("Plateforme › Applications (15/11/2026)", () => {
  beforeEach(() => api.getPlatformApps.mockReset().mockResolvedValue(report()));

  it("montre les installations, les actifs, les plateformes et Plazo Pro", async () => {
    show();
    const installs = await screen.findByTestId("apps-installs");
    expect(installs).toHaveTextContent("142");
    expect(installs).toHaveTextContent("+18 % sur la période d'avant");
    expect(screen.getByTestId("apps-bookings")).toHaveTextContent("64");
    expect(screen.getByTestId("apps-platforms")).toHaveTextContent("iPhone 58 %");
    expect(screen.getByTestId("apps-pro-week")).toHaveTextContent("23 membres actifs sur 31");
    expect(screen.getByTestId("apps-chart").children).toHaveLength(2);
    expect(api.getPlatformApps).toHaveBeenCalledWith(30);
    await userEvent.click(screen.getByTestId("apps-period-7"));
    expect(api.getPlatformApps).toHaveBeenCalledWith(7);
  });

  it("dit que la mesure commence quand rien n'est encore compté", async () => {
    api.getPlatformApps.mockResolvedValue(report({ measuredSince: null }));
    show();
    expect(await screen.findByText(/Pas encore de mesure/)).toBeInTheDocument();
  });

  it("calcule l'évolution sur la période d'avant", () => {
    expect(trend(142, 120)).toBe(18);
    expect(trend(5, 0)).toBeNull();
  });
});
