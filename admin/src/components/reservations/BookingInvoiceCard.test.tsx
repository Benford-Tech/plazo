import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { InvoiceView, ReservationInvoices } from "@/lib/types";
import { BookingInvoiceCard } from "./BookingInvoiceCard";

const api = vi.hoisted(() => ({
  reservationInvoices: vi.fn(),
  createInvoice: vi.fn(),
  sendInvoice: vi.fn(),
  creditInvoice: vi.fn(),
  invoicePdf: vi.fn(),
  invoicePreview: vi.fn(),
}));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "s1", role: "manager" } }),
}));

const invoice: InvoiceView = {
  id: "i1",
  kind: "invoice",
  number: "F-2026-0042",
  issuedAt: "2026-11-19T10:42:00Z",
  totalTtcCents: 5400,
  customer: { name: "Julie Martin", email: null, company: null, address: null },
  sentAt: null,
  sentTo: null,
  creditOf: null,
  creditedBy: null,
};
const none: ReservationInvoices = {
  billing: { complete: true, missing: [] },
  canCreate: true,
  refusal: null,
  customerEmail: null,
  request: null,
  invoices: [],
};

const renderCard = () =>
  render(
    <MemoryRouter>
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <BookingInvoiceCard
          reservationId="r1"
          priceCents={5400}
          channel="phone"
          paymentMethod="card"
        />
      </QueryClientProvider>
    </MemoryRouter>,
  );

// 06/11/2026 (« une facture au nom du parking avec son logo », direction A).
describe("BookingInvoiceCard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("crée la facture avec la société du client, puis l'envoie à une adresse saisie", async () => {
    api.reservationInvoices.mockResolvedValue(none);
    api.createInvoice.mockResolvedValue({
      ...none,
      canCreate: false,
      refusal: "invoice_exists",
      invoices: [invoice],
    });
    api.sendInvoice.mockResolvedValue({
      sentAt: "2026-11-19T10:45:00Z",
      sentTo: "julie@example.fr",
    });
    renderCard();
    expect(
      await screen.findByText("54,00 € · Carte bancaire"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText("+ Société ou adresse du client"));
    fireEvent.change(screen.getByLabelText("Société du client (facultatif)"), {
      target: { value: "ACME SARL" },
    });
    fireEvent.click(screen.getByText("Créer la facture"));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Facture F-2026-0042 créée."),
    );
    expect(api.createInvoice).toHaveBeenCalledWith("r1", {
      customerCompany: "ACME SARL",
      customerAddress: undefined,
    });
    expect(screen.getByTestId("invoice-F-2026-0042")).toHaveTextContent(
      "pas encore envoyée",
    );
    expect(screen.queryByText("Créer la facture")).not.toBeInTheDocument();

    // No address on the booking: one is asked.
    fireEvent.click(screen.getByText("Envoyer au client"));
    fireEvent.change(screen.getByLabelText("Adresse e-mail du client"), {
      target: { value: "julie@example.fr" },
    });
    fireEvent.submit(
      screen.getByLabelText("Adresse e-mail du client").closest("form")!,
    );
    await waitFor(() =>
      expect(api.sendInvoice).toHaveBeenCalledWith("i1", "julie@example.fr"),
    );
    expect(toast.success).toHaveBeenCalledWith(
      "Facture envoyée à julie@example.fr.",
    );
  });

  it("dit pourquoi une facture ne peut pas être créée", async () => {
    api.reservationInvoices.mockResolvedValue({
      ...none,
      canCreate: false,
      refusal: "billing_incomplete",
      billing: { complete: false, missing: ["siret"] },
    });
    renderCard();
    expect(await screen.findByTestId("invoice-refusal")).toHaveTextContent(
      "informations de facturation",
    );
    expect(
      screen.getByText("Compléter dans Parking › Réglages"),
    ).toHaveAttribute("href", "/parking/reglages");
    expect(screen.queryByText("Créer la facture")).not.toBeInTheDocument();
  });

  it("montre l'avoir qui annule une facture", async () => {
    api.reservationInvoices.mockResolvedValue({
      ...none,
      invoices: [
        {
          ...invoice,
          id: "c1",
          kind: "credit_note",
          number: "A-2026-0001",
          totalTtcCents: -5400,
          creditOf: "F-2026-0042",
        },
        {
          ...invoice,
          creditedBy: "A-2026-0001",
          sentAt: "2026-11-19T10:45:00Z",
          sentTo: "julie@example.fr",
        },
      ],
    });
    renderCard();
    expect(await screen.findByTestId("invoice-F-2026-0042")).toHaveTextContent(
      "Annulée par l'avoir A-2026-0001",
    );
    expect(screen.getByTestId("invoice-A-2026-0001")).toHaveTextContent(
      "annule la facture F-2026-0042",
    );
    expect(screen.queryByText("Faire un avoir")).not.toBeInTheDocument();
    expect(screen.getByText("Créer la facture")).toBeInTheDocument();
  });

  it("montre la demande du client et préremplit sa société", async () => {
    api.reservationInvoices.mockResolvedValue({
      ...none,
      request: {
        at: "2026-11-19T17:20:00Z",
        company: "ACME SARL",
        address: "4 rue Garibaldi, 69006 Lyon",
      },
    });
    api.createInvoice.mockResolvedValue({
      ...none,
      canCreate: false,
      refusal: "invoice_exists",
      invoices: [invoice],
    });
    renderCard();
    expect(await screen.findByTestId("invoice-requested")).toHaveTextContent(
      "Demandée par le client le",
    );
    expect(screen.getByLabelText("Société du client (facultatif)")).toHaveValue(
      "ACME SARL",
    );
    fireEvent.click(screen.getByText("Créer la facture"));
    await waitFor(() =>
      expect(api.createInvoice).toHaveBeenCalledWith("r1", {
        customerCompany: "ACME SARL",
        customerAddress: "4 rue Garibaldi, 69006 Lyon",
      }),
    );
  });
});
