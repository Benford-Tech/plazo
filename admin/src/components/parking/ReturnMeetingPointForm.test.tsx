import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/lib/api";
import { ReturnMeetingPointForm } from "./ReturnMeetingPointForm";
import { ShuttleVehicles } from "./ShuttleVehicles";

const api = vi.hoisted(() => ({
  getReturnMeetingPoint: vi.fn(),
  setReturnMeetingPoint: vi.fn(),
  getVehicles: vi.fn(),
  addVehicle: vi.fn(),
  removeVehicle: vi.fn(),
}));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});
// MapLibre has no WebGL in jsdom: a stub that reports clicks.
vi.mock("./MeetingPointMap", () => ({
  default: ({ point, onPick }: { point: { lat: number; lng: number } | null; onPick: (p: { lat: number; lng: number }) => void }) => (
    <button type="button" data-testid="meeting-point-map" onClick={() => onPick({ lat: 45.7205, lng: 5.0817 })}>
      {point ? `marker ${point.lat},${point.lng}` : "no marker"}
    </button>
  ),
}));

const renderIn = (ui: React.ReactElement) =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);

describe("Point de rendez-vous au retour", () => {
  beforeEach(() => {
    api.getReturnMeetingPoint.mockResolvedValue({ data: null });
    api.setReturnMeetingPoint.mockImplementation(async (point: unknown) => ({ data: point }));
  });

  it("place le point sur la carte, saisit libellé et consignes, et enregistre", async () => {
    const user = userEvent.setup();
    renderIn(<ReturnMeetingPointForm />);
    expect(await screen.findByText("Aucun point défini : l'aéroport de votre fiche est utilisé.")).toBeInTheDocument();
    // Saving without a point is refused locally.
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));
    expect(toast.error).toHaveBeenCalledWith("Placez d'abord le point sur la carte.");
    expect(api.setReturnMeetingPoint).not.toHaveBeenCalled();

    await user.click(await screen.findByTestId("meeting-point-map"));
    expect(screen.getByText("Position : 45.72050, 5.08170")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Libellé"), "Terminal 1 · Porte 12");
    await user.type(screen.getByLabelText("Consignes pour le voyageur"), "Sortez côté parkings.");
    expect(screen.getByText(/479 caractères restants/)).toBeInTheDocument();
    await user.type(screen.getByLabelText("Photo du point de rendez-vous (adresse web)"), "https://example.com/p.jpg");
    expect(screen.getByRole("img", { name: "Aperçu de la photo du point de rendez-vous" })).toHaveAttribute("src", "https://example.com/p.jpg");
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() =>
      expect(api.setReturnMeetingPoint).toHaveBeenCalledWith({
        lat: 45.7205,
        lng: 5.0817,
        label: "Terminal 1 · Porte 12",
        instructions: "Sortez côté parkings.",
        photoUrl: "https://example.com/p.jpg",
      }),
    );
    expect(toast.success).toHaveBeenCalledWith("Point de rendez-vous enregistré.");
    expect(await screen.findByRole("button", { name: "Supprimer le point" })).toBeInTheDocument();
  });

  it("montre le point existant, traduit les erreurs de champ, et peut le supprimer", async () => {
    const user = userEvent.setup();
    api.getReturnMeetingPoint.mockResolvedValue({ data: { lat: 45.72, lng: 5.08, label: "T1", instructions: "x", photoUrl: null } });
    api.setReturnMeetingPoint.mockRejectedValueOnce(new ApiError(400, "validation_failed", "validation_failed", { photoUrl: "invalid_url" }));
    renderIn(<ReturnMeetingPointForm />);
    expect(await screen.findByText("marker 45.72,5.08")).toBeInTheDocument();
    expect(screen.getByLabelText("Libellé")).toHaveValue("T1");
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));
    expect(await screen.findByText("Adresse https:// invalide.")).toBeInTheDocument();
    api.setReturnMeetingPoint.mockResolvedValueOnce({ data: null });
    await user.click(screen.getByRole("button", { name: "Supprimer le point" }));
    await waitFor(() => expect(api.setReturnMeetingPoint).toHaveBeenLastCalledWith(null));
    expect(toast.success).toHaveBeenCalledWith("Point de rendez-vous supprimé.");
  });

  it("cherche un lieu par le géocodeur IGN et place le point dessus", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ features: [{ geometry: { coordinates: [5.0811, 45.7256] }, properties: { label: "Aéroport Lyon Saint-Exupéry" } }] }), { status: 200 }),
    );
    renderIn(<ReturnMeetingPointForm />);
    await user.type(await screen.findByLabelText("Rechercher une adresse ou un lieu"), "Lyon Saint-Exupéry{Enter}");
    await user.click(await screen.findByRole("button", { name: "Aéroport Lyon Saint-Exupéry" }));
    expect(screen.getByText("Position : 45.72560, 5.08110")).toBeInTheDocument();
    expect(String(fetchMock.mock.calls[0][0])).toContain("data.geopf.fr/geocodage/search?q=Lyon+Saint-Exup");
    fetchMock.mockRestore();
  });
});

describe("Navettes", () => {
  it("liste, ajoute et retire les véhicules", async () => {
    const user = userEvent.setup();
    api.getVehicles.mockResolvedValue({ data: [{ id: "v1", model: "Mercedes Vito", colour: "blanche", plate: "GH-456-JK" }] });
    api.addVehicle.mockResolvedValue({ data: { id: "v2", model: "Renault Trafic", colour: null, plate: null } });
    api.removeVehicle.mockResolvedValue(undefined);
    renderIn(<ShuttleVehicles />);
    expect(await screen.findByText("Mercedes Vito")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Modèle"), "Renault Trafic");
    await user.click(screen.getByRole("button", { name: "Ajouter la navette" }));
    await waitFor(() => expect(api.addVehicle).toHaveBeenCalledWith({ model: "Renault Trafic", colour: null, plate: null }));
    expect(await screen.findByText("Renault Trafic")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retirer la navette Mercedes Vito" }));
    await waitFor(() => expect(api.removeVehicle).toHaveBeenCalledWith("v1"));
    await waitFor(() => expect(screen.queryByText("Mercedes Vito")).not.toBeInTheDocument());
  });
});
