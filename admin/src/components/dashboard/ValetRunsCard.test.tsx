import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ValetRuns } from "@/lib/types";
import { ValetRunsCard } from "./ValetRunsCard";

const valetRuns = vi.fn();
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, valetRuns: () => valetRuns() } };
});
vi.mock("@/components/reservations/ReservationQuickCard", () => ({ useQuickCard: () => ({ open: vi.fn() }) }));

const run = (patch: Partial<ValetRuns["runs"][number]>) => ({
  id: "r1:arrival",
  reservationId: "r1",
  kind: "arrival" as const,
  state: "todo" as const,
  meetAt: "2026-10-27T07:15:00.000Z",
  leaveAt: "2026-10-27T06:50:00.000Z",
  takenBy: null,
  takenAt: null,
  doneAt: null,
  mine: false,
  reference: "R7KQ2M",
  customerName: "Claire Martin",
  customerPhone: "0612345678",
  plate: "GH-456-JK",
  passengers: 2,
  status: "upcoming" as const,
  ...patch,
});

function renderCard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ValetRunsCard />
    </QueryClientProvider>,
  );
}

describe("ValetRunsCard", () => {
  it("liste les courses avec leur sens et qui les a prises", async () => {
    valetRuns.mockResolvedValue({
      serverTime: "2026-10-27T06:00:00.000Z",
      meetingPoint: "Terminal 1 · dépose-minute",
      runs: [run({}), run({ id: "r2:departure", reservationId: "r2", kind: "departure", state: "taken", takenBy: { id: "s1", firstName: "Karim" } })],
      counts: { todo: 1, taken: 1, done: 0 },
    } satisfies ValetRuns);
    renderCard();
    expect(await screen.findByText("Courses au terminal")).toBeInTheDocument();
    expect(screen.getByText("Rendez-vous : Terminal 1 · dépose-minute")).toBeInTheDocument();
    expect(screen.getByTestId("valet-run-r1:arrival")).toHaveTextContent(/Arrivée.*Claire Martin.*À prendre/);
    expect(screen.getByTestId("valet-run-r2:departure")).toHaveTextContent(/Départ.*Karim/);
  });

  it("reste caché sans course", async () => {
    valetRuns.mockResolvedValue({ serverTime: "", meetingPoint: "", runs: [], counts: { todo: 0, taken: 0, done: 0 } });
    const { container } = renderCard();
    await new Promise(r => setTimeout(r, 20));
    expect(container).toBeEmptyDOMElement();
  });
});
