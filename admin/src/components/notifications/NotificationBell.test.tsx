import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { NotificationBell } from "./NotificationBell";

const api = vi.hoisted(() => ({ bellCount: vi.fn(), bell: vi.fn(), markBellRead: vi.fn() }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...Object.fromEntries(Object.entries(api).map(([k, f]) => [k, (...a: unknown[]) => f(...a)])) } };
});

const now = new Date().toISOString();
const page = {
  unread: 1,
  hasMore: false,
  data: [
    { id: "n1", event: "booking_new", title: "Nouvelle réservation · Allopark", body: "Jean Dupont · 12 nov. 08:30", target: "/reservations/r1", createdAt: now, readAt: null },
    { id: "n2", event: "shuttle", title: "Navette partie", body: "Karim", target: null, createdAt: now, readAt: now },
  ],
};

const renderBell = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<NotificationBell />} />
          <Route path="/reservations/:id" element={<p>Fiche ouverte</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe("NotificationBell (02/11/2026)", () => {
  beforeEach(() => {
    Object.values(api).forEach(f => f.mockReset());
    api.bellCount.mockResolvedValue({ unread: 1 });
    api.bell.mockResolvedValue(page);
    api.markBellRead.mockResolvedValue({ unread: 0 });
  });

  it("montre le nombre de non lues, la liste, et un clic ouvre la fiche en la marquant lue", async () => {
    renderBell();
    expect(await screen.findByTestId("bell-count")).toHaveTextContent("1");
    await userEvent.click(screen.getByRole("button", { name: "Notifications, 1 non lue" }));
    expect(await screen.findByText("Nouvelle réservation · Allopark")).toBeInTheDocument();
    expect(screen.getByTestId("bell-item-n1")).toHaveAttribute("data-unread", "true");
    expect(screen.getByTestId("bell-item-n2")).not.toHaveAttribute("data-unread");
    expect(screen.getByText("Aujourd'hui")).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("bell-item-n1"));
    expect(api.markBellRead).toHaveBeenCalledWith(["n1"]);
    expect(await screen.findByText("Fiche ouverte")).toBeInTheDocument();
  });

  it("filtre et marque tout lu", async () => {
    renderBell();
    await userEvent.click(await screen.findByTestId("bell"));
    await screen.findByText("Navette partie");
    await userEvent.click(screen.getByRole("button", { name: "Navette" }));
    await waitFor(() => expect(api.bell).toHaveBeenLastCalledWith("shuttle", undefined));
    await userEvent.click(screen.getByRole("button", { name: "Tout marquer lu" }));
    expect(api.markBellRead).toHaveBeenCalledWith(undefined);
  });
});
