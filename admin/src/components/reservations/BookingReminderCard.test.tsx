import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { BookingReminder } from "@/lib/types";
import { BookingReminderCard } from "./BookingReminderCard";

const api = vi.hoisted(() => ({ getBookingReminder: vi.fn(), sendBookingReminder: vi.fn() }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const base: BookingReminder = {
  status: "planned",
  at: "2099-06-15T18:00",
  sentAt: null,
  resend: false,
  canSend: true,
  refusal: null,
  timezone: "Europe/Paris",
};

const renderCard = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <BookingReminderCard reservationId="r1" />
    </QueryClientProvider>,
  );

// 30/10/2026 (« pouvoir envoyer un SMS de la veille à une réservation donnée », choix A).
describe("BookingReminderCard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("dit quand le SMS part et l'envoie maintenant", async () => {
    api.getBookingReminder.mockResolvedValue(base);
    api.sendBookingReminder.mockResolvedValue({ ...base, status: "sent", sentAt: "2099-06-14T10:00", resend: true, canSend: false, refusal: "reminder_too_soon" });
    renderCard();
    expect(await screen.findByTestId("booking-reminder-status")).toHaveTextContent("Prévu");
    fireEvent.click(screen.getByTestId("booking-reminder-send"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("SMS de la veille envoyé."));
    expect(api.sendBookingReminder).toHaveBeenCalledWith("r1");
    expect(screen.getByTestId("booking-reminder-status")).toHaveTextContent("Envoyé");
    expect(screen.getByTestId("booking-reminder-send")).toBeDisabled();
    expect(screen.getByTestId("booking-reminder-refusal")).toHaveTextContent("moins de 10 minutes");
  });

  it("demande confirmation avant de renvoyer", async () => {
    api.getBookingReminder.mockResolvedValue({ ...base, status: "sent", sentAt: "2099-06-14T10:00", resend: true });
    api.sendBookingReminder.mockResolvedValue({ ...base, status: "sent", sentAt: "2099-06-14T10:30", resend: true });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderCard();
    fireEvent.click(await screen.findByText("Renvoyer le SMS"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("SMS de la veille renvoyé."));
    expect(confirm).toHaveBeenCalled();
    confirm.mockRestore();
  });

  it("avec WhatsApp, le bouton dit le canal et le SMS en repli (10/11/2026, choix A)", async () => {
    api.getBookingReminder.mockResolvedValue({ ...base, status: "sent", sentAt: "2099-06-14T10:00", resend: true, whatsapp: true });
    api.sendBookingReminder.mockResolvedValue({ ...base, status: "sent", sentAt: "2099-06-14T10:30", resend: true, whatsapp: true });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderCard();
    expect(await screen.findByRole("heading", { name: "Message de la veille" })).toBeInTheDocument();
    expect(screen.getByTestId("booking-reminder-fallback")).toHaveTextContent("SMS si WhatsApp ne passe pas");
    expect(screen.queryByTestId("delivery-pill")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Renvoyer par WhatsApp" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Message de la veille renvoyé."));
    confirm.mockRestore();
  });

  it("dit si le message est parti par WhatsApp ou par SMS (10/11/2026)", async () => {
    api.getBookingReminder.mockResolvedValue({
      ...base,
      status: "sent",
      sentAt: "2099-06-14T18:00",
      resend: true,
      whatsapp: true,
      delivery: { by: "whatsapp", status: "read", statusAt: "2099-06-14T18:05", whatsappFallback: false },
    });
    renderCard();
    const pill = await screen.findByTestId("delivery-pill");
    expect(pill).toHaveAttribute("data-by", "whatsapp");
    expect(pill).toHaveTextContent("WhatsApp· lu à 18:05");
  });

  it("dit « SMS · WhatsApp non remis » quand le SMS est parti à sa place", async () => {
    api.getBookingReminder.mockResolvedValue({
      ...base,
      status: "sent",
      sentAt: "2099-06-14T18:00",
      resend: true,
      whatsapp: true,
      delivery: { by: "sms", status: "sent", statusAt: null, whatsappFallback: true },
    });
    renderCard();
    expect(await screen.findByTestId("delivery-pill")).toHaveTextContent("SMS· WhatsApp non remis");
  });

  it("ne montre rien une fois la voiture déposée sans SMS", async () => {
    api.getBookingReminder.mockResolvedValue({ ...base, status: "not_sent", at: null, canSend: false, refusal: "reminder_not_upcoming" });
    const { container } = renderCard();
    await waitFor(() => expect(api.getBookingReminder).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 0));
    expect(container).toBeEmptyDOMElement();
  });
});
