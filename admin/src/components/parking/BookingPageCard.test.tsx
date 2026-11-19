import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/lib/api";
import type { BookingPageSettings } from "@/lib/types";
import { BookingPageCard } from "./BookingPageCard";

// Réservation Plazo dans votre site (19/11/2026, niveau 3). Fictional parking only.

const api = vi.hoisted(() => ({ getBookingPage: vi.fn(), updateBookingPage: vi.fn() }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { demo: null } }) }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const off: BookingPageSettings = {
  enabled: false,
  slug: "parking-des-cedres",
  saved: false,
  accent: "#FF6600",
  listingOnline: true,
  listingTitle: "Parking des Cèdres",
  page: "https://www.plazo.fr/r/parking-des-cedres",
  embed: '<script src="https://www.plazo.fr/r/embed.js" data-plazo="parking-des-cedres" async></script>',
};

const renderCard = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <BookingPageCard />
    </QueryClientProvider>,
  );

describe("Réservation Plazo dans votre site", () => {
  beforeEach(() => vi.clearAllMocks());

  it("ouvre la page, puis montre le code et le lien", async () => {
    const user = userEvent.setup();
    api.getBookingPage.mockResolvedValue({ data: off });
    api.updateBookingPage.mockResolvedValue({ data: { ...off, enabled: true, saved: true } });
    renderCard();
    await user.click(await screen.findByTestId("booking-page-enable"));
    expect(api.updateBookingPage.mock.calls[0][0]).toEqual({ enabled: true, slug: "parking-des-cedres", accent: "#FF6600" });
    expect(await screen.findByTestId("booking-page-code")).toHaveTextContent('data-plazo="parking-des-cedres"');
    expect(screen.getByTestId("booking-page-state")).toHaveTextContent("En ligne");
  });

  it("sans fiche en ligne, la page ne s'ouvre pas", async () => {
    api.getBookingPage.mockResolvedValue({ data: { ...off, listingOnline: false } });
    renderCard();
    expect(await screen.findByTestId("booking-page-enable")).toBeDisabled();
    expect(screen.getByText(/Votre fiche doit d'abord être en ligne/)).toBeInTheDocument();
  });

  it("dit pourquoi une adresse est refusée", async () => {
    const user = userEvent.setup();
    api.getBookingPage.mockResolvedValue({ data: off });
    api.updateBookingPage.mockRejectedValue(new ApiError(400, "Invalid", "validation_failed", { slug: "taken" }));
    renderCard();
    await user.click(await screen.findByTestId("booking-page-enable"));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Cette adresse est déjà prise par un autre parking."));
  });
});
