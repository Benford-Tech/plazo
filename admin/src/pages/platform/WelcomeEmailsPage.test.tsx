import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WelcomeReport } from "@/lib/types";
import WelcomeEmailsPage from "./WelcomeEmailsPage";

const api = vi.hoisted(() => ({ getWelcomeReport: vi.fn() }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, getWelcomeReport: (d: number, o?: string | null) => api.getWelcomeReport(d, o) } };
});

const row = (over: Partial<WelcomeReport["rows"][number]>) => ({
  id: "r1",
  operatorId: "op1",
  operatorName: "APL Parking Lyon",
  parking: "APL Parking Lyon",
  traveller: "Camille M.",
  email: "c•••••@gmail.com",
  reference: "#5916717",
  channel: "aggregator",
  channelDetail: "Onepark",
  createdAt: "2026-11-17T17:30:00Z",
  arrivalAt: "2026-11-22T05:30:00Z",
  handledAt: "2026-11-17T17:32:00Z",
  outcome: "sent" as const,
  ...over,
});

const report: WelcomeReport = {
  days: 30,
  from: "2026-10-19T00:00:00Z",
  counts: { bookings: 120, sent: 1, handledNotSent: 1, notCandidate: 118, pending: 0 },
  reasons: [
    { reason: "cancelled", count: 96 },
    { reason: "no_email", count: 22 },
  ],
  outcomes: [],
  rows: [row({}), row({ id: "r2", traveller: "Marc T.", email: null, reference: "BQE32P55", channelDetail: "Parclick", outcome: "no_email" })],
  truncated: false,
  operators: [{ id: "op1", name: "APL Parking Lyon" }],
};

function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <WelcomeEmailsPage />
    </QueryClientProvider>,
  );
}

describe("Plateforme › Mails d'accueil (18/11/2026)", () => {
  beforeEach(() => {
    api.getWelcomeReport.mockReset();
    api.getWelcomeReport.mockResolvedValue(report);
  });

  it("montre les mails envoyés et pourquoi les autres ne l'ont pas eu", async () => {
    show();
    expect(await screen.findByText("Camille M.")).toBeInTheDocument();
    expect(screen.getByText("c•••••@gmail.com")).toBeInTheDocument();
    expect(screen.queryByText("Marc T.")).not.toBeInTheDocument();
    expect(screen.getByText("Pourquoi les 118 autres ne l'ont pas eu")).toBeInTheDocument();
    expect(screen.getByText("Annulée ou non venue")).toBeInTheDocument();
    expect(screen.getByTestId("welcome-not-candidate")).toHaveTextContent("118");

    await userEvent.click(screen.getByTestId("welcome-tab-other"));
    expect(screen.getByText("Marc T.")).toBeInTheDocument();
    expect(screen.getByText("Sans e-mail")).toBeInTheDocument();
  });

  it("filtre par parking et par période", async () => {
    show();
    await screen.findByText("Camille M.");
    await userEvent.selectOptions(screen.getByTestId("welcome-operator"), "op1");
    await userEvent.click(screen.getByTestId("welcome-period-7"));
    expect(api.getWelcomeReport).toHaveBeenLastCalledWith(7, "op1");
  });
});
