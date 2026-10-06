import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ArrivalBlock } from "../ArrivalBlock";
import type { TravellerArrival } from "@/lib/types";

const rules = { maxMinutes: 120, arrivedWithinMeters: 150, positionIntervalSeconds: 10, announceMinutes: [10, 20, 30] };
const open = (kind: "outbound" | "return", over: Partial<TravellerArrival> = {}): TravellerArrival => ({
  reference: "R7KQ2M",
  moment: { kind, open: true, opensAt: "2026-10-07T04:00:00Z", closesAt: "2026-10-07T10:00:00Z" },
  meetingPoint: kind === "outbound" ? { lat: 45.73, lng: 5.05, source: "parking", label: null } : { lat: 45.72, lng: 5.08, source: "return_point", label: "Terminal 1 · Porte 12" },
  signal: null,
  rules,
  ...over,
});
const json = (body: unknown) => ({ ok: true, status: 200, json: async () => body });

describe("ArrivalBlock (D : prévenir de mon arrivée sur le site)", () => {
  beforeEach(() => vi.useFakeTimers({ now: Date.UTC(2026, 9, 7, 6, 0, 0) }));
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("attend l’ouverture du moment, puis permet de prévenir sans partager", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(json(open("outbound", { moment: { kind: "outbound", open: false, opensAt: "2026-10-07T04:00:00Z", closesAt: "2026-10-07T10:00:00Z" } })));
    vi.stubGlobal("fetch", fetchMock);
    render(<ArrivalBlock reference="R7KQ2M" token="tok" />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/public/bookings/R7KQ2M/arrival", expect.objectContaining({ method: "GET", headers: { "x-booking-token": "tok" } }));
    expect(screen.getByTestId("arrival-block")).toHaveTextContent("Le jour de votre dépôt, à partir de");
    expect(screen.queryByRole("button", { name: /partager ma position/ })).not.toBeInTheDocument();
  });

  it("« J’arrive dans 20 min » prévient le parking, puis s’annule", async () => {
    const announced = open("outbound", {
      signal: { kind: "outbound", state: "announced", endReason: null, startedAt: "2026-10-07T06:00:00Z", expiresAt: "2026-10-07T08:00:00Z", secondsLeft: 7200, distanceM: null, etaMinutes: 20, etaAt: "2026-10-07T06:20:00Z", announcedMinutes: 20, atMeetingPointAt: null, positionUpdatedAt: null },
    });
    const fetchMock = vi.fn().mockResolvedValueOnce(json(open("outbound"))).mockResolvedValueOnce(json(announced)).mockResolvedValueOnce(json(open("outbound", { signal: { ...announced.signal!, state: "ended", endReason: "stopped" } })));
    vi.stubGlobal("fetch", fetchMock);
    render(<ArrivalBlock reference="R7KQ2M" token="tok" />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByRole("button", { name: "Je suis en route — partager ma position" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Prévenir sans partager ma position" }));
    fireEvent.change(screen.getByLabelText("Un mot pour le parking (facultatif)"), { target: { value: " 2 enfants, poussette " } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "J’arrive dans 20 min" }));
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchMock).toHaveBeenLastCalledWith("/api/public/bookings/R7KQ2M/arrival/announce", expect.objectContaining({ method: "POST", body: JSON.stringify({ kind: "outbound", minutes: 20, note: "2 enfants, poussette" }) }));
    expect(screen.getByTestId("arrival-announced")).toHaveTextContent("Le parking est prévenu : vous arrivez dans 20 min (vers 08:20).");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Annuler" }));
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchMock).toHaveBeenLastCalledWith("/api/public/bookings/R7KQ2M/arrival/stop", expect.objectContaining({ body: JSON.stringify({ kind: "outbound" }) }));
    expect(screen.getByTestId("arrival-block")).toHaveTextContent("Partage arrêté. Votre position a été effacée.");
  });

  it("partage la position du navigateur : démarrage, positions (une par 10 s), arrêt", async () => {
    const sharing = (eta: number | null) =>
      open("outbound", {
        signal: { kind: "outbound", state: "sharing", endReason: null, startedAt: "2026-10-07T06:00:00Z", expiresAt: "2026-10-07T08:00:00Z", secondsLeft: 7200, distanceM: eta === null ? null : 2100, etaMinutes: eta, etaAt: eta === null ? null : "2026-10-07T06:04:00Z", announcedMinutes: null, atMeetingPointAt: null, positionUpdatedAt: null },
      });
    const fetchMock = vi.fn().mockResolvedValueOnce(json(open("outbound"))).mockResolvedValueOnce(json(sharing(null))).mockResolvedValue(json(sharing(4)));
    vi.stubGlobal("fetch", fetchMock);
    let onPosition: ((p: GeolocationPosition) => void) | null = null;
    const geolocation = { watchPosition: vi.fn((ok: (p: GeolocationPosition) => void) => ((onPosition = ok), 7)), clearWatch: vi.fn(), getCurrentPosition: vi.fn() };
    vi.stubGlobal("navigator", { ...navigator, geolocation });
    render(<ArrivalBlock reference="R7KQ2M" token="tok" />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Je suis en route — partager ma position" }));
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/public/bookings/R7KQ2M/arrival/start", expect.objectContaining({ body: JSON.stringify({ kind: "outbound", consent: true }) }));
    expect(screen.getByTestId("arrival-sharing")).toHaveTextContent("Position partagée avec le parking");
    expect(screen.getByTestId("arrival-eta")).toHaveTextContent("—");
    expect(geolocation.watchPosition).toHaveBeenCalledTimes(1);

    const fix = (lat: number) => ({ coords: { latitude: lat, longitude: 5.06, accuracy: 12 }, timestamp: Date.now() }) as unknown as GeolocationPosition;
    await act(async () => {
      onPosition!(fix(45.72));
      onPosition!(fix(45.721)); // within 10 s: not sent
      await vi.advanceTimersByTimeAsync(0);
    });
    const positions = fetchMock.mock.calls.filter(c => String(c[0]).endsWith("/arrival/position"));
    expect(positions).toHaveLength(1);
    expect(JSON.parse(positions[0][1].body)).toMatchObject({ lat: 45.72, lng: 5.06, accuracy: 12 });
    expect(screen.getByTestId("arrival-eta")).toHaveTextContent("4 min");
    expect(screen.getByTestId("arrival-sharing")).toHaveTextContent("2,1 km");

    fetchMock.mockResolvedValue(json(open("outbound", { signal: { ...sharing(4).signal!, state: "ended", endReason: "stopped" } })));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Arrêter le partage" }));
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(geolocation.clearWatch).toHaveBeenCalledWith(7);
    expect(fetchMock).toHaveBeenLastCalledWith("/api/public/bookings/R7KQ2M/arrival/stop", expect.anything());
  });

  it("au retour : « Je suis au point de rendez-vous », avec la position jointe une fois", async () => {
    const done = open("return", {
      signal: { kind: "return", state: "at_meeting_point", endReason: null, startedAt: "2026-10-07T06:00:00Z", expiresAt: "2026-10-07T08:00:00Z", secondsLeft: 7200, distanceM: null, etaMinutes: null, etaAt: null, announcedMinutes: null, atMeetingPointAt: "2026-10-07T06:01:00Z", positionUpdatedAt: null },
    });
    const fetchMock = vi.fn().mockResolvedValueOnce(json(open("return"))).mockResolvedValueOnce(json(done));
    vi.stubGlobal("fetch", fetchMock);
    const geolocation = { watchPosition: vi.fn(), clearWatch: vi.fn(), getCurrentPosition: vi.fn((ok: (p: GeolocationPosition) => void) => ok({ coords: { latitude: 45.7201, longitude: 5.0802 } } as GeolocationPosition)) };
    vi.stubGlobal("navigator", { ...navigator, geolocation });
    render(<ArrivalBlock reference="R7KQ2M" token="tok" />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByTestId("arrival-block")).toHaveTextContent("rejoignez le point de rendez-vous : Terminal 1 · Porte 12");
    fireEvent.click(screen.getByRole("checkbox"));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Je suis au point de rendez-vous" }));
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchMock).toHaveBeenLastCalledWith("/api/public/bookings/R7KQ2M/arrival/at-meeting-point", expect.objectContaining({ body: JSON.stringify({ kind: "return", lat: 45.7201, lng: 5.0802 }) }));
    expect(screen.getByTestId("arrival-done")).toHaveTextContent("Le chauffeur sait que vous êtes là");
    expect(screen.getByTestId("arrival-done")).toHaveTextContent("Restez au point de rendez-vous : Terminal 1 · Porte 12.");
  });
});
