import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Parking } from "@/lib/types";
import { ShuttleTrackingCard } from "./ShuttleTrackingCard";

const api = vi.hoisted(() => ({ setShuttleTracking: vi.fn() }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const parking: Parking = {
  id: "p1",
  name: "Parking du Rhône",
  address: null,
  timezone: "Europe/Paris",
  totalCapacity: 120,
  safetyMarginPct: 0,
  shuttleTravelMinutes: 8,
  terminalLeadMinutes: 120,
  landingDelayMinutes: 30,
  shuttleTracking: "everyone",
  declaredCapacity: 120,
  effectiveCapacity: 120,
  capacitySource: "declared",
  bookableCapacity: 120,
  lat: null,
  lng: null,
};

describe("ShuttleTrackingCard (R-B)", () => {
  it("trois niveaux avec qui voit quoi ; enregistre le choix", async () => {
    api.setShuttleTracking.mockResolvedValue({ data: { ...parking, shuttleTracking: "off" } });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ShuttleTrackingCard parking={parking} />
      </QueryClientProvider>,
    );
    const everyone = screen.getByTestId("tracking-everyone");
    expect(within(everyone).getByRole("radio")).toBeChecked();
    expect(within(everyone).getByText("Recommandé")).toBeInTheDocument();
    expect(within(screen.getByTestId("tracking-team")).getByText(/Clients ✕/)).toBeInTheDocument();
    expect(screen.getByText("Dans tous les cas, « Votre navette est partie » est envoyé au départ de chaque trajet.")).toBeInTheDocument();
    expect(screen.getByTestId("tracking-save")).toBeDisabled();

    await userEvent.click(within(screen.getByTestId("tracking-off")).getByRole("radio"));
    await userEvent.click(screen.getByTestId("tracking-save"));
    await waitFor(() => expect(api.setShuttleTracking).toHaveBeenCalledWith("p1", "off"));
  });
});
