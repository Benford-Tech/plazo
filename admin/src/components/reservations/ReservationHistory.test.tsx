import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { HistoryEvent } from "@/lib/types";
import { ReservationHistory } from "./ReservationHistory";

const api = vi.hoisted(() => ({
  getReservationHistory: vi.fn(),
  staffPhoto: vi.fn(async () => new Blob(["x"], { type: "image/jpeg" })),
}));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const author = (kind: HistoryEvent["author"]["kind"], name: string | null, staffId: string | null = null) => ({
  kind,
  name,
  staffId,
  photoUpdatedAt: null,
  viewAs: false,
});
const events: HistoryEvent[] = [
  {
    id: "3",
    at: "2026-10-30T09:47:00.000Z",
    action: "reservation.status_changed",
    group: "status",
    author: author("staff", "Karim", "s1"),
    changes: [],
    info: { from: "upcoming", to: "arrived" },
  },
  {
    id: "2",
    at: "2026-10-29T16:12:00.000Z",
    action: "reservation.updated",
    group: "change",
    author: author("staff", "Joanny", "s2"),
    changes: [{ field: "returnAt", from: "2 nov. 20:00", to: "3 nov. 18:00" }],
    info: {},
  },
  {
    id: "1",
    at: "2026-10-28T08:00:00.000Z",
    action: "reservation.created",
    group: "change",
    author: author("comparator", "Allopark"),
    changes: [],
    info: {},
  },
];

const renderBlock = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ReservationHistory reservationId="r1" />
    </QueryClientProvider>,
  );

// 30/10/2026 (« avoir un historique des actions et de l'auteur sur les réservations », direction A).
describe("ReservationHistory", () => {
  beforeEach(() => api.getReservationHistory.mockResolvedValue({ data: events }));

  it("lists each action with its author, newest first, and before → after", async () => {
    renderBlock();
    const rows = await screen.findAllByTestId("history-event");
    expect(rows.map((r) => r.dataset.action)).toEqual(["reservation.status_changed", "reservation.updated", "reservation.created"]);
    expect(rows[0]).toHaveTextContent("Karim a changé l'état");
    expect(within(rows[0]).getByTestId("history-status")).toHaveTextContent("AttenduSur place");
    expect(within(rows[1]).getByTestId("history-changes")).toHaveTextContent("Retour :2 nov. 20:003 nov. 18:00");
    expect(rows[2]).toHaveTextContent("Allopark · Comparateur a créé la réservation");
    expect(screen.getByText("Historique")).toBeInTheDocument();
  });

  it("filters by kind of action", async () => {
    renderBlock();
    await screen.findAllByTestId("history-event");
    fireEvent.click(screen.getByTestId("history-filter-status"));
    expect(screen.getAllByTestId("history-event")).toHaveLength(1);
    fireEvent.click(screen.getByTestId("history-filter-message"));
    expect(screen.getByText("Rien à afficher pour ce filtre.")).toBeInTheDocument();
  });

  it("shows nothing without history", async () => {
    api.getReservationHistory.mockResolvedValue({ data: [] });
    const { container } = renderBlock();
    await new Promise((r) => setTimeout(r, 0));
    expect(container).toBeEmptyDOMElement();
  });
});
