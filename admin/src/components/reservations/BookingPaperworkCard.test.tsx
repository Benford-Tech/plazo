import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/lib/api";
import type { BookingInspection, BookingPaperwork } from "@/lib/types";
import { BookingPaperworkCard } from "./BookingPaperworkCard";

const api = vi.hoisted(() => ({
  getBookingContract: vi.fn(),
  inspectionPhoto: vi.fn(),
  reservationContractFile: vi.fn(),
}));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const photo = (id: string, slot: string) => ({
  id,
  slot,
  takenAt: "2026-11-12T10:18:00Z",
});

const report = (over: Partial<BookingInspection> = {}): BookingInspection => ({
  kind: "dropoff",
  startedAt: "2026-11-12T10:10:00Z",
  completedAt: "2026-11-12T10:18:00Z",
  performedBy: "Karim",
  damages: [
    {
      n: 1,
      x: 0.7,
      y: 0.6,
      label: "Rayure portière arrière droite",
      photoId: "d1",
    },
  ],
  mileageKm: 48210,
  fuelQuarters: 3,
  notes: "Jante avant gauche frottée",
  photos: [
    photo("p-front", "front"),
    photo("p-right", "right"),
    photo("d1", "damage"),
  ],
  photosErased: false,
  decision: "accepted",
  decidedAt: "2026-11-12T10:19:00Z",
  decisionMethod: "handwritten",
  reserveText: null,
  ...over,
});

const paperwork = (over: Partial<BookingPaperwork> = {}): BookingPaperwork => ({
  status: "returned",
  photosAvailable: true,
  contract: {
    status: "signed",
    atCounter: false,
    template: {
      id: "t3",
      title: "Contrat des Cèdres",
      version: 3,
      pageCount: 2,
      fileName: "c.pdf",
    },
    files: { template: true, signed: true, proof: true },
    signed: {
      version: "pdf-3",
      signedAt: "2026-11-12T10:20:00Z",
      signerName: "Sébastien Morel",
      method: "sms_code",
      device: "staff_device",
      phoneMasked: "06 •• •• •• 78",
      witnessName: "Karim",
      proofSha256: "9f3a".padEnd(64, "0"),
      signedSha256: "e07b".padEnd(64, "0"),
    },
  },
  dropoff: report(),
  return: report({
    kind: "return",
    completedAt: "2026-11-19T17:50:00Z",
    photos: [photo("r-front", "front")],
    damages: [],
    decision: "reserved",
    decisionMethod: "booking_link",
    reserveText: "Rayure nouvelle sur le pare-chocs",
  }),
  travellerReports: {
    dropoff: {
      kind: "dropoff",
      startedAt: "2026-11-12T10:00:00Z",
      completedAt: "2026-11-12T10:05:00Z",
      notes: "Avant de partir",
      photos: [photo("t1", "front"), photo("t2", "back")],
      photosErased: false,
    },
    return: null,
  },
  ...over,
});

const renderCard = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <BookingPaperworkCard reservationId="r1" status="returned" />
    </QueryClientProvider>,
  );

describe("BookingPaperworkCard (12/11/2026, « Contrat et état des lieux »)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn((b: Blob) => `blob:${b.size}`),
      revokeObjectURL: vi.fn(),
    });
    api.inspectionPhoto.mockImplementation(
      async () => new Blob(["jpg"], { type: "image/jpeg" }),
    );
  });

  it("montre le contrat signé, ses fichiers et l'état des lieux du dépôt", async () => {
    api.getBookingContract.mockResolvedValue(paperwork());
    api.reservationContractFile.mockResolvedValue({
      blob: new Blob(["%PDF"]),
      filename: "contrat.pdf",
    });
    renderCard();
    const contract = await screen.findByTestId("paperwork-contract");
    expect(contract).toHaveTextContent("Sébastien Morel");
    expect(contract).toHaveTextContent("code par SMS au 06 •• •• •• 78");
    expect(contract).toHaveTextContent("témoin Karim");
    expect(contract).toHaveTextContent("Contrat du parking v3");
    await userEvent.click(
      within(contract).getByRole("button", { name: "Preuve de signature" }),
    );
    await waitFor(() =>
      expect(api.reservationContractFile).toHaveBeenCalledWith("r1", "proof"),
    );

    expect(screen.getByRole("tab", { name: /Dépôt · 12\/11/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("tab", { name: "Photos du client · 2" }),
    ).toBeInTheDocument();
    const grid = screen.getByTestId("photos-dropoff");
    expect(within(grid).getByText("Avant")).toBeInTheDocument();
    expect(within(grid).getByText("Arrière")).toBeInTheDocument();
    expect(within(grid).getAllByText("Pas de photo")).toHaveLength(2);
    await waitFor(() =>
      expect(within(grid).getByRole("img", { name: "Avant" })).toHaveAttribute(
        "src",
        "blob:3",
      ),
    );
    expect(api.inspectionPhoto).toHaveBeenCalledWith(
      "r1",
      "dropoff",
      "p-front",
    );
    expect(screen.getByTestId("damage")).toHaveTextContent(
      "Rayure portière arrière droite",
    );
    expect(screen.getByText("48 210 km")).toBeInTheDocument();
    expect(screen.getByText("3/4")).toBeInTheDocument();
    expect(screen.getByText("Conforme · signé à la main")).toBeInTheDocument();
    expect(screen.getByText("Jante avant gauche frottée")).toBeInTheDocument();
  });

  it("ouvre une photo en grand, à côté de celle du retour ; Échap ferme", async () => {
    api.getBookingContract.mockResolvedValue(paperwork());
    renderCard();
    await userEvent.click(
      await screen.findByRole("button", { name: "Agrandir la photo Avant" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Photo en grand" });
    expect(within(dialog).getByText(/Au dépôt ·/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Au retour ·/)).toBeInTheDocument();
    await waitFor(() =>
      expect(api.inspectionPhoto).toHaveBeenCalledWith(
        "r1",
        "return",
        "r-front",
      ),
    );
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("montre la réserve du retour et les photos du client", async () => {
    api.getBookingContract.mockResolvedValue(paperwork());
    renderCard();
    await userEvent.click(await screen.findByRole("tab", { name: /Retour/ }));
    expect(
      screen.getByText("Réserve · dans l'application"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("« Rayure nouvelle sur le pare-chocs »"),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("tab", { name: "Photos du client · 2" }),
    );
    const mine = screen.getByTestId("traveller-dropoff");
    expect(mine).toHaveTextContent("Au dépôt");
    expect(mine).toHaveTextContent("« Avant de partir »");
    await waitFor(() =>
      expect(api.inspectionPhoto).toHaveBeenCalledWith("r1", "dropoff", "t2"),
    );
  });

  it("dit « Photos indisponibles » quand le stockage manque", async () => {
    api.getBookingContract.mockResolvedValue(
      paperwork({ photosAvailable: false }),
    );
    renderCard();
    expect(await screen.findByText("Photos indisponibles")).toBeInTheDocument();
    expect(api.inspectionPhoto).not.toHaveBeenCalled();
  });

  it("dit « Photos indisponibles » sur une photo quand l'API répond 503", async () => {
    api.getBookingContract.mockResolvedValue(
      paperwork({
        return: null,
        travellerReports: { dropoff: null, return: null },
      }),
    );
    api.inspectionPhoto.mockRejectedValue(
      new ApiError(503, "unavailable", "photos_unavailable"),
    );
    renderCard();
    await waitFor(() =>
      expect(
        screen.getAllByText("Photos indisponibles").length,
      ).toBeGreaterThan(0),
    );
    expect(screen.queryByRole("tab", { name: /Photos du client/ })).toBeNull();
  });

  it("sans contrat signé ni état des lieux, n'affiche que la ligne du contrat", async () => {
    api.getBookingContract.mockResolvedValue(
      paperwork({
        contract: {
          ...paperwork().contract,
          status: "unsigned",
          signed: null,
          files: { template: false, signed: false, proof: false },
          template: null,
        },
        dropoff: null,
        return: null,
        travellerReports: { dropoff: null, return: null },
      }),
    );
    renderCard();
    expect(
      await screen.findByText("Contrat pas encore signé"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).toBeNull();
  });
});
