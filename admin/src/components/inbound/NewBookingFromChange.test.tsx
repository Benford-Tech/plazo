import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { canCreateFromChange } from "@/lib/inbound-new-booking";
import type { InboundEmail } from "@/lib/types";
import { NewBookingFromChange } from "./NewBookingFromChange";

const api = vi.hoisted(() => ({ createReservation: vi.fn(), attachInboundEmail: vi.fn() }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

// The mail of the screenshot: a Onepark change of a closed booking.
const mail: InboundEmail = {
  id: "e1",
  status: "unrecognised",
  fromAddress: "noreply@onepark.fr",
  fromName: "Onepark",
  subject: "Modification de la réservation #5904227",
  textBody: "…",
  provider: "Onepark",
  parsed: {
    provider: "Onepark",
    externalReference: "5904227",
    customerFirstName: "Jessica",
    customerLastName: "FERRARINI",
    customerPhone: "+33 6 58 40 51 67",
    arrivalAt: "2026-11-13T11:00",
    returnAt: "2026-11-17T11:00",
    vehicleModel: "PEUGEOT",
    passengers: 4,
    priceCents: 2000,
  },
  missing: [],
  reservationId: null,
  reservationReference: null,
  reading: null,
  receivedAt: "2026-11-10T08:00:00Z",
  analysedAt: null,
  pageLookup: null,
  change: {
    applied: false,
    reason: "reservation_closed",
    reservationId: "r9",
    reference: "R9F3NZ",
    at: "2026-11-10T08:00:00Z",
    changes: [
      { field: "returnAt", from: "2026-11-17T11:00", to: "2026-11-16T16:00" },
      { field: "plate", from: null, to: "DT-670-RJ" },
      { field: "returnFlight", from: "44 90", to: "EJU 4490" },
      { field: "vehicleModel", from: "PEUGEOT", to: "Renault" },
    ],
  },
} as InboundEmail;

const renderForm = (email = mail) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <NewBookingFromChange email={email} />
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe("NewBookingFromChange (10/11/2026, choix A)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("se propose seulement pour une modification d’une réservation close, sans réservation rattachée", () => {
    expect(canCreateFromChange(mail)).toBe(true);
    expect(canCreateFromChange({ ...mail, reservationId: "r1" })).toBe(false);
    expect(canCreateFromChange({ ...mail, change: { ...mail.change!, reason: "already_arrived" } })).toBe(false);
    expect(canCreateFromChange({ ...mail, change: { ...mail.change!, kind: "cancellation" } })).toBe(false);
  });

  it("pré-remplit avec les nouvelles valeurs, crée la réservation et rattache le mail", async () => {
    api.createReservation.mockResolvedValue({ data: { id: "r10", reference: "R10ABC" } });
    api.attachInboundEmail.mockResolvedValue({ message: "ok" });
    renderForm();
    expect(screen.getByTestId("inbound-new-returnAt")).toHaveValue("2026-11-16T16:00");
    expect(screen.getByTestId("inbound-new-plate")).toHaveValue("DT-670-RJ");
    expect(screen.getByTestId("inbound-new-returnFlight")).toHaveValue("EJU 4490");
    expect(screen.getByTestId("inbound-new-vehicle")).toHaveValue("Renault");
    expect(screen.getByTestId("inbound-new-price")).toHaveValue("20,00");
    fireEvent.change(screen.getByTestId("inbound-new-passengers"), { target: { value: "3" } });
    fireEvent.click(screen.getByTestId("inbound-new-create"));
    await waitFor(() => expect(api.attachInboundEmail).toHaveBeenCalledWith("e1", "r10"));
    expect(api.createReservation).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: "aggregator",
        channelDetail: "Onepark",
        externalReference: "5904227",
        takeReferenceFromClosed: true,
        arrivalAt: "2026-11-13T11:00",
        returnAt: "2026-11-16T16:00",
        customerFirstName: "Jessica",
        customerLastName: "FERRARINI",
        plate: "DT-670-RJ",
        returnFlight: "EJU 4490",
        vehicleModel: "Renault",
        passengers: 3,
        priceCents: 2000,
      }),
    );
    expect(await screen.findByTestId("inbound-new-booking-done")).toHaveTextContent("R10ABC");
  });
});
