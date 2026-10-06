import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StayShuttles } from "../StayShuttles";
import type { StayShuttles as Data } from "@/lib/types";

const shuttle = (tripId: string, mine: boolean): Data["shuttles"][number] => ({
  tripId,
  direction: mine ? "pickup" : "dropoff",
  mine,
  startedAt: "2026-10-07T06:00:00Z",
  vehicle: { model: "Vito", colour: mine ? "blanc" : null, plate: mine ? "AB-123-CD" : null },
  driverFirstName: mine ? "Karim" : "Léa",
  position: { lat: 45.72, lng: 5.07 },
  positionAgeSeconds: 8,
  distanceM: 2100,
  etaMinutes: mine ? 4 : 9,
  etaAt: null,
  destination: mine ? { kind: "meeting_point", lat: 45.72, lng: 5.08, label: "Terminal 1" } : { kind: "parking", lat: 45.73, lng: 5.05, label: null },
});

describe("StayShuttles (D : navettes du séjour sur le site)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("se cache hors séjour, liste les navettes en route et repère la sienne", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ phase: null, serverTime: "", shuttles: [] }) satisfies Data });
    vi.stubGlobal("fetch", fetchMock);
    const { unmount } = render(<StayShuttles reference="R7KQ2M" token="tok" />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.queryByTestId("stay-shuttles")).not.toBeInTheDocument();
    unmount();

    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ phase: "return", serverTime: "", shuttles: [shuttle("t1", true), shuttle("t2", false)] }) satisfies Data });
    render(<StayShuttles reference="R7KQ2M" token="tok" />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchMock).toHaveBeenLastCalledWith("/api/public/bookings/R7KQ2M/shuttles", expect.objectContaining({ headers: { "x-booking-token": "tok" } }));
    expect(screen.getByRole("heading", { name: "Navette · 2 en route" })).toBeInTheDocument();
    expect(screen.getByTestId("stay-shuttle-t1")).toHaveTextContent("Navette blanc");
    expect(screen.getByTestId("stay-shuttle-t1")).toHaveTextContent("Votre navette");
    expect(screen.getByTestId("stay-shuttle-t1")).toHaveTextContent("chauffeur : Karim · va chercher des voyageurs à l’aéroport · à 4 min du point de rendez-vous");
    expect(screen.getByTestId("stay-shuttle-t2")).toHaveTextContent("chauffeur : Léa · à 9 min du parking");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(12_000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
