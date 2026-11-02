import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ParkingLogoCard } from "./ParkingLogoCard";

const api = vi.hoisted(() => ({
  setOperatorLogo: vi.fn(async () => ({ logoUpdatedAt: "2026-11-02T16:00:00.000Z" })),
  removeOperatorLogo: vi.fn(async () => undefined),
  operatorLogo: vi.fn(async () => new Blob(["x"], { type: "image/png" })),
}));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});
const auth = vi.hoisted(() => ({ logo: null as string | null, refresh: vi.fn(async () => undefined) }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "s1", name: "Joanny S", role: "manager", operatorName: "Parking des Cèdres", operatorLogoUpdatedAt: auth.logo },
    refresh: auth.refresh,
  }),
}));

const renderCard = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ParkingLogoCard />
    </QueryClientProvider>,
  );

describe("ParkingLogoCard", () => {
  beforeAll(() => {
    URL.createObjectURL = vi.fn(() => "blob:logo");
    URL.revokeObjectURL = vi.fn();
  });

  it("invites to add a logo when there is none", () => {
    auth.logo = null;
    renderCard();
    expect(screen.getByTestId("parking-logo-choose")).toHaveTextContent("Ajouter le logo");
    expect(screen.queryByTestId("parking-logo-remove")).toBeNull();
    expect(screen.getByTestId("parking-logo-preview")).toHaveTextContent("Plazo Pro s'affiche seul");
  });

  it("shows the logo in the preview and removes it", async () => {
    auth.logo = "2026-11-02T15:00:00.000Z";
    renderCard();
    await waitFor(() => expect(screen.getAllByTestId("parking-logo").length).toBeGreaterThan(0));
    expect(api.operatorLogo).toHaveBeenCalledWith("2026-11-02T15:00:00.000Z");
    expect(screen.getByTestId("parking-logo-preview")).toHaveTextContent("Parking des Cèdres");
    fireEvent.click(screen.getByTestId("parking-logo-remove"));
    await waitFor(() => expect(api.removeOperatorLogo).toHaveBeenCalled());
    await waitFor(() => expect(auth.refresh).toHaveBeenCalled());
  });
});
