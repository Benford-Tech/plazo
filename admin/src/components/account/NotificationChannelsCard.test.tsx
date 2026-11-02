import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationChannelsCard } from "./NotificationChannelsCard";

const api = vi.hoisted(() => ({ notificationChannels: vi.fn(), setNotificationChannels: vi.fn(), setBookingNotify: vi.fn(), testNotification: vi.fn() }));
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...Object.fromEntries(Object.entries(api).map(([k, f]) => [k, (...a: unknown[]) => f(...a)])) } };
});
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { role: "manager" } }) }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const channels = {
  role: "manager",
  bookings: "hourly",
  channels: {
    booking_new: { phone: true, browser: true, bell: true },
    inbox: { phone: false, browser: true, bell: true },
    arrival: { phone: true, browser: false, bell: true },
    team: { phone: true, browser: true, bell: true },
  },
  webPush: { available: false, publicKey: null },
  devices: { phones: [{ platform: "ios", updatedAt: "2026-11-02T20:30:00Z" }], browsers: [] },
};

const renderCard = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <NotificationChannelsCard />
    </QueryClientProvider>,
  );

describe("NotificationChannelsCard (02/11/2026)", () => {
  beforeEach(() => {
    Object.values(api).forEach(f => f.mockReset());
    toast.success.mockReset();
    api.notificationChannels.mockResolvedValue(channels);
  });

  it("montre quoi arrive où, enregistre un réglage et le choix des nouvelles réservations", async () => {
    api.setNotificationChannels.mockResolvedValue({ ...channels, channels: { ...channels.channels, inbox: { phone: true, browser: true, bell: true } } });
    renderCard();
    const inbox = await screen.findByTestId("channels-inbox");
    expect(within(inbox).getByText("Mail à vérifier")).toBeInTheDocument();
    const phone = within(inbox).getByRole("checkbox", { name: "Mail à vérifier · Téléphone" });
    expect(phone).not.toBeChecked();
    await userEvent.click(phone);
    expect(api.setNotificationChannels).toHaveBeenCalledWith({ inbox: { phone: true } });
    await waitFor(() => expect(within(screen.getByTestId("channels-inbox")).getByRole("checkbox", { name: "Mail à vérifier · Téléphone" })).toBeChecked());

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Nouvelle réservation · Téléphone" }), "immediate");
    expect(api.setBookingNotify).toHaveBeenCalledWith("immediate");
    // The browser column waits for the VAPID keys.
    expect(within(inbox).getByRole("checkbox", { name: "Mail à vérifier · Navigateur" })).toBeDisabled();
    expect(screen.getByText("iPhone · Plazo Pro")).toBeInTheDocument();
  });

  it("envoie une notification de test", async () => {
    api.testNotification.mockResolvedValue({ bell: true, browsers: 0, phones: 1, phonesConfigured: true });
    renderCard();
    await userEvent.click(await screen.findByRole("button", { name: "M'envoyer une notification de test" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Notification envoyée dans la cloche, 1 téléphone."));
  });
});
