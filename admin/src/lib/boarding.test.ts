import type { Reservation } from "./types";
import { BOARDING_CHECK_IN_HOURS, boardableUpcoming, canBoardDropoff, departureRowOf } from "./boarding";

const now = Date.parse("2026-10-14T08:00:00Z");
const hours = (h: number, extraMs = 0) => new Date(now + h * 3_600_000 + extraMs).toISOString();

describe("Embarquer en un geste : qui peut monter vers le terminal", () => {
  it("accepte un client attendu jusqu'à 24 h avant ou après son arrivée, bornes comprises (comme le serveur)", () => {
    expect(BOARDING_CHECK_IN_HOURS).toBe(24);
    expect(boardableUpcoming(hours(0), now)).toBe(true);
    expect(boardableUpcoming(hours(24), now)).toBe(true);
    expect(boardableUpcoming(hours(-24), now)).toBe(true);
    expect(boardableUpcoming(hours(24, 1), now)).toBe(false);
    expect(boardableUpcoming(hours(-24, -1), now)).toBe(false);
  });

  it("refuse une date illisible", () => {
    expect(boardableUpcoming("pas une date", now)).toBe(false);
    expect(boardableUpcoming("", now)).toBe(false);
  });

  it("un client pointé monte quelle que soit l'heure ; un client parti, annulé ou attendu un autre jour, non", () => {
    expect(canBoardDropoff({ status: "arrived", arrivalAt: hours(-72) }, now)).toBe(true);
    expect(canBoardDropoff({ status: "upcoming", arrivalAt: hours(5) }, now)).toBe(true);
    expect(canBoardDropoff({ status: "upcoming", arrivalAt: hours(30) }, now)).toBe(false);
    expect(canBoardDropoff({ status: "shuttled_out", arrivalAt: hours(-1) }, now)).toBe(false);
    expect(canBoardDropoff({ status: "cancelled", arrivalAt: hours(1) }, now)).toBe(false);
  });
});

describe("Embarquer en un geste : une réservation ajoutée à la liste des départs", () => {
  const booking = (over: Partial<Reservation> = {}): Reservation =>
    ({
      id: "r7",
      reference: "R7",
      status: "upcoming",
      arrivalAt: hours(5),
      arrivedAt: null,
      passengers: 3,
      customerName: "Sarah Cohen",
      plate: "KL-204-BA",
      spot: null,
      file: null,
      stopId: "gare",
      stop: { id: "gare", name: "Gare TGV" },
      ...over,
    }) as unknown as Reservation;

  it("devient une ligne comme celles du serveur : attendue, sans trajet, avec sa desserte", () => {
    expect(departureRowOf(booking())).toEqual({
      reservationId: "r7",
      reference: "R7",
      customerName: "Sarah Cohen",
      passengers: 3,
      plate: "KL-204-BA",
      status: "upcoming",
      arrivalAt: hours(5),
      arrivedAt: null,
      spot: null,
      stopId: "gare",
      stopName: "Gare TGV",
      tripId: null,
      expected: true,
    });
  });

  it("ne donne que le code de la place, jamais celui d'une file (comme DepartureRow du serveur)", () => {
    const placed = booking({ status: "arrived", arrivedAt: hours(-1), spot: { code: "A12" } });
    expect(departureRowOf(placed)).toMatchObject({ spot: "A12", expected: false });
    const stored = booking({ status: "arrived", arrivedAt: hours(-1), file: { id: "f7", code: "F07", name: null } });
    expect(departureRowOf(stored).spot).toBeNull();
    expect(departureRowOf({ ...stored, spot: { code: "A12" } }).spot).toBe("A12");
  });
});
