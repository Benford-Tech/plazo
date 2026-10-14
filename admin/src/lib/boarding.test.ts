import { BOARDING_CHECK_IN_HOURS, boardableUpcoming, canBoardDropoff } from "./boarding";

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
