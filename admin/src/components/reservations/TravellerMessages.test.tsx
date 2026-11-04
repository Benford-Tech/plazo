import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { TravellerMessages } from "./TravellerMessages";

const api = vi.hoisted(() => ({ getReservationMessages: vi.fn() }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const renderBlock = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <TravellerMessages reservationId="r1" />
    </QueryClientProvider>,
  );

describe("TravellerMessages (04/11/2026)", () => {
  it("une ligne par message : canal, état, et le repli SMS d'un WhatsApp non remis", async () => {
    api.getReservationMessages.mockResolvedValue({
      data: [
        { id: "s1", kind: "flight_landed", channel: "sms", status: "sent", at: "2026-11-15T20:44:00Z", statusAt: "2026-11-15T20:44:00Z", whatsappFallback: true, errorCode: null },
        { id: "w1", kind: "booking_confirmed", channel: "whatsapp", status: "read", at: "2026-11-05T13:12:00Z", statusAt: "2026-11-05T13:20:00Z", whatsappFallback: false, errorCode: null },
      ],
    });
    renderBlock();
    expect(await screen.findByText("Messages au voyageur · 2")).toBeInTheDocument();
    const [landing, confirmation] = screen.getAllByTestId("traveller-message");
    expect(within(landing).getByText("Atterrissage")).toBeInTheDocument();
    expect(within(landing).getByText("WhatsApp non remis · SMS envoyé à la place")).toBeInTheDocument();
    expect(within(landing).getByText("SMS")).toBeInTheDocument();
    expect(within(landing).getByText("Envoyé à 21:44")).toBeInTheDocument();
    expect(within(confirmation).getByText("WhatsApp")).toBeInTheDocument();
    expect(within(confirmation).getByText("✓✓ Lu à 14:20")).toBeInTheDocument();
  });

  it("rien d'envoyé : le bloc est caché", async () => {
    api.getReservationMessages.mockResolvedValue({ data: [] });
    const { container } = renderBlock();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container).toBeEmptyDOMElement();
  });
});
