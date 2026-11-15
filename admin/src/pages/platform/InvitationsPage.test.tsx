import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import InvitationsPage from "./InvitationsPage";

const api = vi.hoisted(() => ({ getPlatformInvitations: vi.fn() }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const base = {
  kind: "team" as const,
  operator: { id: "o1", name: "APL Parking" },
  sends: 2,
  sentAt: "2026-11-14T08:02:00.000Z",
  emailSent: true,
  store: null,
  demoAt: null,
  web: null,
};

beforeEach(() => {
  api.getPlatformInvitations.mockResolvedValue({
    data: [
      {
        ...base,
        id: "t1",
        staff: { id: "s1", name: "Nawfel Ben", email: "nawfel@example.com", role: "driver", isActive: true },
        opened: { at: "2026-11-14T08:40:00.000Z", lastAt: null, count: 3, device: "iphone" },
        clicked: { at: "2026-11-14T08:41:00.000Z", device: "iphone" },
        store: { at: "2026-11-14T08:41:00.000Z", store: "app_store" },
        passwordSetAt: "2026-11-14T08:43:00.000Z",
        app: { at: "2026-11-14T17:05:00.000Z", platform: "ios" },
      },
      {
        ...base,
        id: "t2",
        sends: 1,
        staff: { id: "s2", name: "Pascal Roux", email: "pascal@example.com", role: "agent", isActive: true },
        opened: null,
        clicked: null,
        passwordSetAt: null,
        app: null,
      },
    ],
    counts: { all: 2, not_opened: 1, not_clicked: 1, no_app: 1 },
  });
});

it("montre chaque étape de l'invitation et filtre", async () => {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <InvitationsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  const nawfel = await screen.findByTestId("invitation-s1");
  expect(nawfel).toHaveTextContent("iPhone · 3 fois · approx.");
  expect(nawfel).toHaveTextContent("App Store");
  expect(nawfel).toHaveTextContent("2 envois");
  expect(screen.getAllByTestId("step-app")[0]).toHaveTextContent("iPhone");
  expect(screen.getByTestId("invitation-s2")).toHaveTextContent("Accueil");
  expect(screen.getByTestId("invitations-view-no_app")).toHaveTextContent("Pas dans l'app · 1");
  await userEvent.click(screen.getByTestId("invitations-view-no_app"));
  await waitFor(() => expect(api.getPlatformInvitations).toHaveBeenLastCalledWith("no_app"));
});
