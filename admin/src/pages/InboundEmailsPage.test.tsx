import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import type { InboundEmail } from "@/lib/types";
import InboundEmailsPage from "./InboundEmailsPage";

const api = vi.hoisted(() => ({ getInboundEmails: vi.fn(), dismissInboundEmail: vi.fn() }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const email = (over: Partial<InboundEmail> = {}): InboundEmail => ({
  id: "e1",
  status: "incomplete",
  fromAddress: "info@allopark.com",
  fromName: "ALLOPARK",
  subject: "Confirmation AL-884880719",
  textBody: "Bonjour Jean Dupont, votre réservation…",
  provider: "Allopark",
  parsed: { provider: "Allopark", externalReference: "AL-884880719", customerName: "Jean Dupont", arrivalAt: "2026-10-01T08:30", returnAt: "2026-10-03T17:00", priceCents: 3499 },
  missing: ["customerPhone", "plate"],
  reservationId: null,
  reservationReference: null,
  receivedAt: "2026-10-06T08:00:00Z",
  ...over,
});

function Where() {
  const location = useLocation();
  return <p data-testid="where">{location.pathname + " " + JSON.stringify(location.state)}</p>;
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/reservations/a-verifier"]}>
        <Routes>
          <Route path="/reservations/a-verifier" element={<InboundEmailsPage />} />
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("InboundEmailsPage (M-A : mails à vérifier)", () => {
  beforeEach(() => {
    api.getInboundEmails.mockReset().mockResolvedValue({
      data: [email(), email({ id: "e2", status: "unrecognised", provider: null, parsed: null, missing: [], subject: "Question", fromName: null, fromAddress: "client@example.com" }), email({ id: "e3", status: "imported", missing: [], reservationId: "r9", reservationReference: "RXYZ99" })],
    });
    api.dismissInboundEmail.mockReset().mockResolvedValue({ data: email({ id: "e2", status: "dismissed", textBody: null }) });
  });

  it("liste les mails avec leur état, ce qui manque, et mène au formulaire prérempli", async () => {
    renderPage();
    const rows = await screen.findAllByTestId("inbound-row");
    expect(rows).toHaveLength(3);
    expect(within(rows[0]).getByText("Incomplets")).toBeInTheDocument();
    expect(within(rows[0]).getByText("ALLOPARK · info@allopark.com · Reconnu : Allopark")).toBeInTheDocument();
    expect(within(rows[0]).getByText("Manque : téléphone, plaque")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Non reconnus")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Saisir la réservation")).toBeInTheDocument();
    expect(within(rows[2]).getByRole("link", { name: "Ouvrir RXYZ99" })).toHaveAttribute("href", "/reservations/r9");

    await userEvent.click(within(rows[0]).getByText("Voir le mail"));
    expect(within(rows[0]).getByText("Bonjour Jean Dupont, votre réservation…")).toBeInTheDocument();
    await userEvent.click(within(rows[0]).getByTestId("inbound-complete"));
    expect(screen.getByTestId("where")).toHaveTextContent("/reservations/nouvelle");
    expect(screen.getByTestId("where")).toHaveTextContent('"inboundId":"e1"');
    expect(screen.getByTestId("where")).toHaveTextContent('"customerName":"Jean Dupont"');
  });

  it("classe un mail sans suite", async () => {
    renderPage();
    const rows = await screen.findAllByTestId("inbound-row");
    await userEvent.click(within(rows[1]).getByTestId("inbound-dismiss"));
    await waitFor(() => expect(api.dismissInboundEmail).toHaveBeenCalledWith("e2"));
  });
});
