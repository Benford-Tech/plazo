import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShuttleStops } from "./ShuttleStops";

const api = vi.hoisted(() => ({ getStops: vi.fn(), addStop: vi.fn(), updateStop: vi.fn(), removeStop: vi.fn() }));
const geocode = vi.hoisted(() => vi.fn());
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/lib/geocode", () => ({ geocode }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const renderIn = (ui: React.ReactElement) =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);

const airport = { id: null, kind: "airport", name: "Terminal 1 · Porte 12", lat: 45.7205, lng: 5.0817, instructions: null, builtIn: true };
const station = { id: "s1", kind: "station", name: "Gare Saint-Exupéry TGV", lat: 45.7209, lng: 5.0756, instructions: "Dépose-minute, côté parvis.", builtIn: false };

describe("Dessertes de la navette (D-A)", () => {
  beforeEach(() => {
    api.getStops.mockResolvedValue({ data: [airport, station] });
    geocode.mockResolvedValue([{ label: "Gare de Lyon Saint-Exupéry TGV", lat: 45.7209, lng: 5.0756 }]);
  });

  it("liste l'aéroport (intégré) et les dessertes, en ajoute une par le géocodeur, en retire une", async () => {
    const user = userEvent.setup();
    api.addStop.mockResolvedValue({ data: { id: "s2", kind: "other", name: "Hôtel Kyriad", lat: 45.7209, lng: 5.0756, instructions: null, builtIn: false } });
    api.removeStop.mockResolvedValue(undefined);
    renderIn(<ShuttleStops />);
    expect(await screen.findByText("Terminal 1 · Porte 12")).toBeInTheDocument();
    expect(screen.getByText("Gare Saint-Exupéry TGV")).toBeInTheDocument();
    expect(screen.getByText("Dépose-minute, côté parvis.")).toBeInTheDocument();
    // Without a place found, nothing is sent.
    await user.type(screen.getByLabelText("Nom"), "Hôtel Kyriad");
    await user.click(screen.getByRole("button", { name: "Ajouter la desserte" }));
    expect(api.addStop).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Cherchez d'abord le lieu pour le placer.");
    await user.type(screen.getByLabelText("Adresse ou lieu"), "Gare Lyon");
    await user.click(screen.getByRole("button", { name: "Chercher" }));
    await user.click(await screen.findByRole("button", { name: "Gare de Lyon Saint-Exupéry TGV" }));
    expect(screen.getByText("45.72090, 5.07560")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Type"), "other");
    await user.click(screen.getByRole("button", { name: "Ajouter la desserte" }));
    await waitFor(() => expect(api.addStop).toHaveBeenCalledWith({ kind: "other", name: "Hôtel Kyriad", lat: 45.7209, lng: 5.0756, instructions: null }));
    expect(await screen.findByText("Hôtel Kyriad")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retirer la desserte Gare Saint-Exupéry TGV" }));
    await waitFor(() => expect(api.removeStop).toHaveBeenCalledWith("s1"));
    await waitFor(() => expect(screen.queryByText("Gare Saint-Exupéry TGV")).not.toBeInTheDocument());
  });

  it("modifie une desserte (nom et consignes), sans refaire la recherche", async () => {
    const user = userEvent.setup();
    api.updateStop.mockImplementation(async (id: string, patch: Record<string, unknown>) => ({ data: { ...station, ...patch } }));
    renderIn(<ShuttleStops />);
    await user.click(await screen.findByRole("button", { name: "Modifier la desserte Gare Saint-Exupéry TGV" }));
    expect(screen.getByText("Modification de Gare Saint-Exupéry TGV")).toBeInTheDocument();
    expect(screen.getByLabelText("Nom")).toHaveValue("Gare Saint-Exupéry TGV");
    await user.clear(screen.getByLabelText("Consignes pour le voyageur (facultatif)"));
    await user.type(screen.getByLabelText("Consignes pour le voyageur (facultatif)"), "Parvis, arrêt navettes.");
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(api.updateStop).toHaveBeenCalledWith("s1", { kind: "station", name: "Gare Saint-Exupéry TGV", lat: 45.7209, lng: 5.0756, instructions: "Parvis, arrêt navettes." }));
    expect(await screen.findByText("Parvis, arrêt navettes.")).toBeInTheDocument();
  });
});
