import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import FlyerPage from "./FlyerPage";

const state = vi.hoisted(() => ({ status: "published", phone: "04 78 12 34 56" as string | null }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    adminApi: {
      ...actual.adminApi,
      getListing: vi.fn(async () => ({
        listing: {
          id: "l1",
          slug: "parking-des-cedres",
          status: state.status,
          title: "Parking des Cèdres",
          contactPhone: state.phone,
          airport: { code: "LYS", name: "Lyon Saint-Exupéry", slug: "lyon-saint-exupery" },
        },
        parking: { id: "p1", name: "Cèdres", address: null, shuttleTravelMinutes: 8 },
      })),
      operatorLogo: vi.fn(async () => new Blob(["x"], { type: "image/png" })),
    },
  };
});
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "s1", name: "Joanny S", role: "manager", operatorName: "Parking des Cèdres", operatorLogoUpdatedAt: null } }),
}));
const pdf = vi.hoisted(() => ({ render: vi.fn(async () => 1.41) }));
vi.mock("@/lib/pdf-render", () => ({ loadPdf: vi.fn(async () => ({ numPages: 1, render: pdf.render, destroy: vi.fn() })) }));
const built = vi.hoisted(() => ({ calls: [] as { name: string; phone: string | null; qrUrl: string; format: string }[] }));
vi.mock("@/lib/flyer", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/flyer")>();
  return {
    ...actual,
    buildFlyerPdf: vi.fn(async (input: { name: string; phone: string | null; qrUrl: string; format: string }) => {
      built.calls.push(input);
      return new Uint8Array([37, 80, 68, 70]);
    }),
  };
});

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <FlyerPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe("FlyerPage", () => {
  beforeAll(() => {
    URL.createObjectURL = vi.fn(() => "blob:flyer");
    URL.revokeObjectURL = vi.fn();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 404 })));
  });
  beforeEach(() => {
    built.calls = [];
    state.status = "published";
    state.phone = "04 78 12 34 56";
  });

  it("prefills the name, points the QR code at the parking's page and draws the preview", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId("flyer-name")).toHaveValue("Parking des Cèdres"));
    expect(screen.getByTestId("flyer-qr-url")).toHaveTextContent("/lyon-saint-exupery/parking-des-cedres");
    await waitFor(() => expect(pdf.render).toHaveBeenCalled());
    expect(built.calls[0]).toMatchObject({ name: "Parking des Cèdres", phone: "04 78 12 34 56", format: "a4" });
  });

  it("downloads the A5 sheet with the name typed and without the phone", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId("flyer-download-a5")).not.toBeDisabled());
    fireEvent.change(screen.getByTestId("flyer-name"), { target: { value: "Cèdres Lyon" } });
    fireEvent.click(screen.getByTestId("flyer-phone"));
    fireEvent.click(screen.getByTestId("flyer-download-a5"));
    await waitFor(() => expect(built.calls.some((c) => c.format === "a5")).toBe(true));
    expect(built.calls.find((c) => c.format === "a5")).toMatchObject({ name: "Cèdres Lyon", phone: null });
  });

  it("says where the QR code leads while the listing is not online", async () => {
    state.status = "draft";
    state.phone = null;
    renderPage();
    expect(await screen.findByTestId("flyer-qr-fallback")).toHaveTextContent("pas encore en ligne");
    expect(screen.queryByTestId("flyer-phone")).toBeNull();
    expect(screen.getByText(/Ajoutez le téléphone du parking/)).toBeInTheDocument();
  });
});
