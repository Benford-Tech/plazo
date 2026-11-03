import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { DeletedReservation, Reservation } from "@/lib/types";
import DeletedReservationsPage from "@/pages/DeletedReservationsPage";
import { DeleteReservation } from "./DeleteReservation";

const api = vi.hoisted(() => ({
  deleteReservation: vi.fn(),
  restoreReservation: vi.fn(),
  deletedReservations: vi.fn(),
}));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const booking = (over: Partial<Reservation> = {}) =>
  ({ id: "r1", customerName: "Jean Dupont", channel: "aggregator", status: "upcoming", ...over }) as Reservation;

const wrap = (ui: React.ReactNode) =>
  render(
    <MemoryRouter initialEntries={["/reservations/r1"]}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <Routes>
          <Route path="/reservations/r1" element={ui} />
          <Route path="/reservations" element={<p>liste</p>} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );

describe("supprimer une réservation (03/11/2026)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("demande, envoie la raison, puis revient à la liste", async () => {
    api.deleteReservation.mockResolvedValue({ id: "r1", deletedAt: "", purgeAt: "" });
    wrap(<DeleteReservation reservation={booking()} />);
    await userEvent.click(screen.getByTestId("delete-reservation"));
    expect(screen.getByRole("dialog")).toHaveTextContent("Supprimer la réservation de Jean Dupont ?");
    expect(screen.getByRole("dialog")).toHaveTextContent("45 jours");
    await userEvent.type(screen.getByTestId("delete-reason"), "Doublon");
    await userEvent.click(screen.getByTestId("delete-confirm"));
    await waitFor(() => expect(api.deleteReservation).toHaveBeenCalledWith("r1", "Doublon"));
    expect(await screen.findByText("liste")).toBeInTheDocument();
  });

  it("ne propose rien pour une réservation Plazo ni pour une voiture au parking", () => {
    const { unmount } = wrap(<DeleteReservation reservation={booking({ channel: "plazo" })} />);
    expect(screen.queryByTestId("delete-reservation")).toBeNull();
    unmount();
    wrap(<DeleteReservation reservation={booking({ status: "arrived" })} />);
    expect(screen.queryByTestId("delete-reservation")).toBeNull();
  });

  it("liste les supprimées et en restaure une", async () => {
    const row: DeletedReservation = {
      id: "r9",
      reference: "R7KQ2M",
      customerName: "Marie Leroy",
      plate: "GK-318-PX",
      channel: "counter",
      channelDetail: null,
      status: "upcoming",
      arrivalAt: "2026-11-20T08:00:00Z",
      returnAt: "2026-11-27T18:00:00Z",
      priceCents: 9000,
      deletedAt: new Date().toISOString(),
      purgeAt: new Date(Date.now() + 45 * 86400000).toISOString(),
      deleteReason: "Erreur de dates",
      deletedBy: { firstName: "Joanny" },
    };
    api.deletedReservations.mockResolvedValue({ retentionDays: 45, data: [row] });
    api.restoreReservation.mockResolvedValue({ reservation: {}, overbooked: false });
    wrap(<DeletedReservationsPage />);
    const line = await screen.findByTestId("deleted-r9");
    expect(line).toHaveTextContent("Marie Leroy");
    expect(line).toHaveTextContent("« Erreur de dates »");
    expect(line).toHaveTextContent("par Joanny");
    expect(line).toHaveTextContent("dans 45 j");
    await userEvent.click(screen.getByTestId("restore-r9"));
    await waitFor(() => expect(api.restoreReservation).toHaveBeenCalledWith("r9"));
  });
});
