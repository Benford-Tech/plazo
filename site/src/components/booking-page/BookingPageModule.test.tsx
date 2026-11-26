import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookingPageModule } from "./BookingPageModule";

const quote = vi.fn();
vi.mock("@/lib/booking-page-actions", () => ({
  quoteOnBookingPage: (...args: unknown[]) => quote(...args),
  nightsOnBookingPage: async () => ({ today: "2026-12-05", full: ["2026-12-24"] }),
  bookOnBookingPage: async () => ({ values: {}, fields: {}, error: null }),
}));

const page = { slug: "cedres", title: "Parking des Cèdres", airport: "lyon-saint-exupery", airportName: "Lyon", parking: "cedres", accent: "#1F4E8C", accentInk: "#FFFFFF" };

describe("module de réservation, direction B (26/11/2026)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-12-05T10:00:00"));
    quote.mockReset().mockResolvedValue({ offer: { available: true, days: 8, priceCents: 7200, basePriceCents: 6200, nightFee: { arrivalCents: 1000, returnCents: 0, totalCents: 1000 } }, error: null });
  });

  it("choisit les jours dans le calendrier, lit le prix seul, puis passe à « Vous »", async () => {
    render(<BookingPageModule page={page} idempotencyKey="k-1234567890123456" />);
    await waitFor(() => expect(screen.getByTestId("bp-day-2026-12-24")).toBeDisabled());
    expect(screen.getByTestId("bp-day-2026-12-04")).toBeDisabled();
    expect(screen.getByTestId("bp-continue")).toBeDisabled();

    fireEvent.click(screen.getByTestId("bp-day-2026-12-12"));
    fireEvent.click(screen.getByTestId("bp-drop-06:00"));
    fireEvent.click(screen.getByTestId("bp-day-2026-12-20"));
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    await waitFor(() => expect(screen.getByTestId("bp-total")).toHaveTextContent("72,00"));
    expect(quote).toHaveBeenLastCalledWith("cedres", "2026-12-12T06:00", "2026-12-20T18:00");
    expect(screen.getByText("Frais de nuit")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("bp-continue"));
    expect(screen.getByLabelText("Prénom")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Un passager de plus" }));
    expect(screen.getByTestId("bp-passengers")).toHaveTextContent("2");
    fireEvent.click(screen.getByTestId("bp-edit"));
    expect(screen.getByTestId("bp-calendar")).toBeInTheDocument();
    vi.useRealTimers();
  });
});
