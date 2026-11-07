import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InvoicesCard } from "../InvoicesCard";

const json = (status: number, body: unknown) => ({ ok: status < 400, status, json: async () => body });
const none = { invoices: [], request: null, canRequest: true, refusal: null };
const invoice = {
  id: "i1",
  kind: "invoice",
  number: "F-2026-0042",
  issuedAt: "2026-11-19T10:42:00Z",
  totalTtcCents: 5400,
  issuer: "Parking des Cèdres",
  creditOf: null,
  creditedBy: null,
};

// 07/11/2026 (« Le client peut retrouver ses factures dans Plazo », A + C).
describe("InvoicesCard (« Facture » on Ma réservation)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("asks the parking for the invoice with the company, then says it is asked", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(200, none))
      .mockResolvedValueOnce(json(201, { ...none, canRequest: false, refusal: "already_requested", request: { at: "2026-11-19T17:20:00Z", company: "ACME SARL", address: null } }));
    vi.stubGlobal("fetch", fetchMock);
    render(<InvoicesCard reference="R7KQ2M" token="tok" />);
    expect(await screen.findByText("Pas encore de facture pour ce séjour.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Société (facultatif)"), { target: { value: "ACME SARL" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Demander la facture" }));
    });
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/public/bookings/R7KQ2M/invoices/request",
      expect.objectContaining({ method: "POST", headers: { "x-booking-token": "tok", "content-type": "application/json" }, body: JSON.stringify({ company: "ACME SARL" }) }),
    );
    expect(screen.getByText("Demandée")).toBeInTheDocument();
    expect(screen.getByText(/Demandée le 19 novembre 2026/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Demander la facture" })).not.toBeInTheDocument();
  });

  it("lists the invoice and its credit note, each with its PDF", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        json(200, {
          invoices: [{ ...invoice, id: "c1", kind: "credit_note", number: "A-2026-0001", totalTtcCents: -5400, creditOf: "F-2026-0042" }, { ...invoice, creditedBy: "A-2026-0001" }],
          request: null,
          canRequest: true,
          refusal: null,
        }),
      ),
    );
    render(<InvoicesCard reference="R7KQ2M" token="tok" />);
    expect(await screen.findByTestId("invoice-F-2026-0042")).toHaveTextContent("54,00 € · émise le 19 novembre 2026 par Parking des Cèdres · Annulée par l’avoir A-2026-0001");
    expect(screen.getByTestId("invoice-A-2026-0001")).toHaveTextContent("Annule la facture F-2026-0042");
    expect(screen.getAllByRole("button", { name: "Télécharger le PDF" })).toHaveLength(2);
  });

  it("stays hidden when nothing can be shown nor asked", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(json(200, { ...none, canRequest: false, refusal: "reservation_cancelled" }));
    vi.stubGlobal("fetch", fetchMock);
    const { container } = render(<InvoicesCard reference="R7KQ2M" token="tok" />);
    await act(async () => undefined);
    expect(container).toBeEmptyDOMElement();
  });
});
