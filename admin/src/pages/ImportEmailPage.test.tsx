import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ImportEmailPage from "./ImportEmailPage";

const parseEmail = vi.fn();
const createReservation = vi.fn();
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    adminApi: {
      ...actual.adminApi,
      parseEmail: (...args: unknown[]) => parseEmail(...args),
      createReservation: (...args: unknown[]) => createReservation(...args),
    },
  };
});

const parsed = {
  provider: "Allopark",
  externalReference: "AL-884880719",
  arrivalAt: "2026-10-01T08:30",
  returnAt: "2026-10-03T17:00",
  priceCents: 3499,
  customerName: "Jean Dupont",
};
const capacity = {
  nights: [
    { date: "2026-10-01", count: 268, bookable: 304, free: 36, overbooked: false },
    { date: "2026-10-02", count: 281, bookable: 304, free: 23, overbooked: false },
  ],
  fullNights: [],
  canForce: true,
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ImportEmailPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const paste = (text: string) => fireEvent.change(screen.getByLabelText("Collez le mail de confirmation"), { target: { value: text } });
const MAIL = "ALLOPARK Confirmation de votre réservation AL-884880719 … Du 1 octobre 2026 - 08:30 au 3 octobre 2026 - 17:00 € 34,99";

describe("ImportEmailPage", () => {
  beforeEach(() => {
    parseEmail.mockReset();
    createReservation.mockReset();
  });

  it("affiche ce qui a été lu, demande le reste puis crée la réservation", async () => {
    parseEmail.mockResolvedValue({ parsed, missing: ["customerPhone", "plate"], duplicate: null, capacity });
    createReservation.mockResolvedValue({ data: { id: "r1", reference: "RAB234" } });
    renderPage();
    paste(MAIL);

    expect(await screen.findByText("AL-884880719")).toBeInTheDocument();
    expect(screen.getByText("jeu. 1 oct. · 08:30")).toBeInTheDocument();
    expect(screen.getByText("34,99 €")).toBeInTheDocument();
    expect(screen.getByText("2 nuits · disponible : au moins 23 places libres chaque nuit.")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Téléphone · à compléter"), "0612345678");
    await userEvent.type(screen.getByLabelText("Plaque · à compléter"), "gk318px");
    await userEvent.click(screen.getByRole("button", { name: "Créer la réservation" }));

    await waitFor(() => expect(createReservation).toHaveBeenCalled());
    expect(createReservation.mock.calls[0][0]).toMatchObject({
      channel: "aggregator",
      channelDetail: "Allopark",
      externalReference: "AL-884880719",
      priceCents: 3499,
      arrivalAt: "2026-10-01T08:30",
      returnAt: "2026-10-03T17:00",
      customerName: "Jean Dupont",
      customerPhone: "0612345678",
      plate: "gk318px",
      passengers: 1,
    });
    // Ready for the next email.
    expect(await screen.findByText("Réservation RAB234 créée. Collez le mail suivant.")).toBeInTheDocument();
    expect(screen.getByLabelText("Collez le mail de confirmation")).toHaveValue("");
  });

  it("bloque un mail déjà importé", async () => {
    parseEmail.mockResolvedValue({ parsed, missing: [], duplicate: { id: "r9", reference: "RXY789" }, capacity });
    renderPage();
    paste(MAIL);
    expect(await screen.findByText("Déjà importée : réservation RXY789.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Créer la réservation" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Voir la réservation" })).toHaveAttribute("href", "/reservations/r9");
  });

  it("explique quand le texte n'est pas reconnu", async () => {
    const { ApiError } = await import("@/lib/api");
    parseEmail.mockRejectedValue(new ApiError(422, "Unrecognised email", "unrecognised_email"));
    renderPage();
    paste("Bonjour, ceci est un mail quelconque sans réservation à l'intérieur.");
    expect(await screen.findByText("Ce texte ne ressemble à aucun mail de comparateur connu.")).toBeInTheDocument();
  });
});
