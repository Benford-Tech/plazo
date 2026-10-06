import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hms, mmss, ReturnLive, ringState, stepOf } from "../ReturnLive";
import type { TravellerReturn } from "@/lib/types";

const base: TravellerReturn = {
  reference: "R7KQ2M",
  status: "arrived",
  returnAt: "2026-10-05T23:00",
  returnDay: true,
  flight: { number: "TO 3627", status: "delayed", scheduledAt: null, estimatedAt: null, landedAt: null, landedSource: null, terminal: "1", gate: "12" },
  flightTracked: true,
  meetingPoint: { lat: 45.72, lng: 5.08, label: "Terminal 1 · Porte 12", instructions: null },
  atMeetingPointAt: null,
  shuttle: null,
  parking: { name: "Parking Démo LYS", phone: null, shuttleMinutes: 8, address: "12 route de l’Aéroport", location: { lat: 45.7375, lng: 5.0745 } },
  plate: "AB-123-CD",
  spot: null,
  car: null,
};

describe("ReturnLive", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("formats the countdowns", () => {
    expect(hms(3725)).toBe("01:02:05");
    expect(mmss(250)).toBe("04:10");
    expect(mmss(-3)).toBe("00:00");
  });

  it("counts to the landing with the delay, then to the shuttle", () => {
    const now = Date.UTC(2026, 9, 5, 12, 0, 0);
    const lands = new Date(now + 3725 * 1000).toISOString();
    const scheduled = new Date(now + 3725 * 1000 - 40 * 60000).toISOString();
    const r = ringState({ ...base, flight: { ...base.flight, scheduledAt: scheduled, estimatedAt: lands } }, now);
    expect(r.kicker).toBe("atterrit dans");
    expect(r.big).toBe("01:02:05");
    expect(r.sub).toMatch(/^prévu \d\d:\d\d · retard \+40 min$/);
    expect(stepOf(base)).toBe("flight");
    const landed = { ...base, flight: { ...base.flight, status: "landed", landedAt: lands } };
    expect(ringState(landed, now).kicker).toBe("atterri à");
    expect(stepOf(landed)).toBe("meeting");
    const shuttle = {
      ...landed,
      shuttle: { tripId: "t1", direction: "pickup" as const, mine: true, startedAt: lands, vehicle: { model: "Vito", colour: "blanc", plate: null }, driverFirstName: "Karim", position: null, positionAgeSeconds: 5, distanceM: 2100, etaMinutes: 4, etaAt: new Date(now + 250 * 1000).toISOString() },
    };
    const s = ringState(shuttle, now);
    expect(s).toMatchObject({ kicker: "navette dans", big: "04:10", sub: "à 2,1 km de vous", tone: "peach" });
    expect(stepOf(shuttle)).toBe("shuttle");
  });

  it("renders the block from the server's state, polls the API, and shows the car's spot", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ...base, spot: { code: "A-07", stayClass: "short" } }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<ReturnLive reference="R7KQ2M" token="tok" initial={base} />);
    expect(screen.getByRole("heading", { name: "Vol TO 3627" })).toBeInTheDocument();
    expect(screen.getByText("En direct")).toBeInTheDocument();
    expect(screen.getByText("Point de rendez-vous : Terminal 1 · Porte 12")).toBeInTheDocument();
    expect(screen.queryByTestId("find-car")).not.toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/public/bookings/R7KQ2M/return", expect.objectContaining({ headers: { "x-booking-token": "tok" } }));
    expect(screen.getByTestId("find-car")).toHaveTextContent("Place A-07");
    expect(screen.getByTestId("find-car")).toHaveTextContent("zone séjours courts");
    expect(screen.getByRole("link", { name: /Itinéraire à pied/ })).toHaveAttribute("href", expect.stringContaining("45.7375"));
    vi.unstubAllGlobals();
  });

  it("« J’ai atterri » sans vol suivi, puis les consignes et l’itinéraire du point de rendez-vous", async () => {
    const untracked: TravellerReturn = { ...base, flight: { ...base.flight, status: null }, flightTracked: false, meetingPoint: { ...base.meetingPoint!, instructions: "Sortie 2, sous l’horloge", photoUrl: "https://example.com/rdv.jpg" } };
    const landed = { ...untracked, flight: { ...untracked.flight, status: "landed", landedAt: "2026-10-05T12:00:00Z", landedSource: "traveller" } };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => landed });
    vi.stubGlobal("fetch", fetchMock);
    render(<ReturnLive reference="R7KQ2M" token="tok" initial={untracked} />);
    expect(screen.queryByTestId("meeting-help")).not.toBeInTheDocument();
    await act(async () => {
      screen.getByTestId("landed-button").click();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/public/bookings/R7KQ2M/return/landed", expect.objectContaining({ method: "POST" }));
    expect(screen.queryByTestId("landed-button")).not.toBeInTheDocument();
    expect(screen.getByTestId("meeting-help")).toHaveTextContent("Consignes du parking : Sortie 2, sous l’horloge");
    expect(screen.getByRole("img", { name: "Photo du point de rendez-vous" })).toHaveAttribute("src", "https://example.com/rdv.jpg");
    expect(screen.getByRole("link", { name: /Itinéraire vers le point de rendez-vous/ })).toHaveAttribute("href", expect.stringContaining("45.72%2C5.08"));
    vi.unstubAllGlobals();
  });

  it("E : « Bagage perdu » puis un mot libre partent au parking et restent affichés", async () => {
    const noticed = { ...base, notice: { kind: "luggage" as const, text: null, at: "2026-10-05T12:10:00Z" } };
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => noticed }).mockResolvedValue({ ok: true, json: async () => ({ ...base, notice: { kind: "other", text: "Je prends un café, 15 min", at: "2026-10-05T12:20:00Z" } }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<ReturnLive reference="R7KQ2M" token="tok" initial={base} />);
    await act(async () => {
      screen.getByRole("button", { name: "Bagage perdu ou retardé" }).click();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/public/bookings/R7KQ2M/return/notice", expect.objectContaining({ method: "POST", body: JSON.stringify({ kind: "luggage" }) }));
    expect(screen.getByTestId("return-notice")).toHaveTextContent("Transmis au parking à 14:10 : Bagage perdu ou retardé.");
    await act(async () => {
      screen.getByRole("button", { name: "Signaler autre chose" }).click();
    });
    const input = screen.getByRole("textbox", { name: "Autre…" });
    fireEvent.change(input, { target: { value: "Je prends un café, 15 min" } });
    await act(async () => {
      fireEvent.submit(input.closest("form")!);
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchMock).toHaveBeenLastCalledWith("/api/public/bookings/R7KQ2M/return/notice", expect.objectContaining({ body: JSON.stringify({ kind: "other", text: "Je prends un café, 15 min" }) }));
    expect(screen.getByTestId("return-notice")).toHaveTextContent("Transmis au parking à 14:20 : « Je prends un café, 15 min ».");
    vi.unstubAllGlobals();
  });

  it("routes to the recorded GPS position of the car when there is one", async () => {
    const car = { lat: 45.7301, lng: 5.0502, accuracyM: 6, at: "2026-10-06T07:15:00Z", by: "staff" as const, note: "Rangée 3" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => base }));
    render(<ReturnLive reference="R7KQ2M" token="tok" initial={{ ...base, car }} />);
    expect(screen.getByTestId("find-car")).toHaveTextContent("Votre voiture");
    expect(screen.getByTestId("car-position")).toHaveTextContent("enregistrée par le parking à 09:15 (± 6 m). Rangée 3.");
    expect(screen.getByRole("link", { name: /jusqu’à ma voiture/ })).toHaveAttribute("href", expect.stringContaining("45.7301%2C5.0502"));
    vi.unstubAllGlobals();
  });
});
