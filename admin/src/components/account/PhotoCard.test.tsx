import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { clampFrame, PhotoCard } from "./PhotoCard";

const api = vi.hoisted(() => ({
  removeMyPhoto: vi.fn(async () => ({})),
  staffPhoto: vi.fn(async () => new Blob(["x"], { type: "image/jpeg" })),
}));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});
const auth = vi.hoisted(() => ({
  user: { id: "s1", name: "Joanny Simporé", role: "manager", photoUpdatedAt: null as string | null, demo: null as unknown },
  refresh: vi.fn(async () => undefined),
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const renderCard = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <PhotoCard />
      </MemoryRouter>
    </QueryClientProvider>,
  );

// 30/10/2026 (« pouvoir mettre sa photo »).
describe("PhotoCard", () => {
  beforeAll(() => {
    URL.createObjectURL = vi.fn(() => "blob:photo");
    URL.revokeObjectURL = vi.fn();
  });
  beforeEach(() => {
    auth.user.photoUpdatedAt = null;
    auth.user.demo = null;
    vi.clearAllMocks();
  });

  it("shows the initials and « Choisir une photo » without a photo", () => {
    renderCard();
    expect(screen.getByTestId("avatar-initials")).toHaveTextContent("JS");
    expect(screen.getByTestId("photo-choose")).toHaveTextContent("Choisir une photo");
    expect(screen.queryByTestId("photo-remove")).toBeNull();
  });

  it("shows the photo, and removes it", async () => {
    auth.user.photoUpdatedAt = "2026-10-30T08:00:00.000Z";
    renderCard();
    expect(await screen.findByTestId("avatar-photo")).toHaveAttribute("src", "blob:photo");
    expect(api.staffPhoto).toHaveBeenCalledWith("s1", "2026-10-30T08:00:00.000Z");
    expect(screen.getByTestId("photo-choose")).toHaveTextContent("Changer ma photo");
    fireEvent.click(screen.getByTestId("photo-remove"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Photo retirée."));
    expect(auth.refresh).toHaveBeenCalled();
  });

  it("is read-only in the demo", () => {
    auth.user.demo = { resetsAt: "2026-10-31T01:00:00.000Z" };
    renderCard();
    expect(screen.queryByTestId("photo-choose")).toBeNull();
    expect(screen.getByText("Démo : la photo ne se change pas.")).toBeInTheDocument();
  });

  it("keeps the framed image over the whole round window", () => {
    // A 1000 × 500 image in the 260 px window: 2.6 times bigger than the window's height at zoom 1.
    expect(clampFrame({ zoom: 1, x: 50, y: 20 }, 1000, 500)).toEqual({ zoom: 1, x: 0, y: 0 });
    expect(clampFrame({ zoom: 1, x: -900, y: 0 }, 1000, 500)).toEqual({ zoom: 1, x: -260, y: 0 });
    expect(clampFrame({ zoom: 2, x: -100, y: -500 }, 1000, 500)).toEqual({ zoom: 2, x: -100, y: -260 });
  });
});
