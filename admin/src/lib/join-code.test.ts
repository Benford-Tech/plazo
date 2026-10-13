import { joinCodeRefetchMs } from "./join-code";

const code = (validUntil: string) => ({ code: "K7QM2-XP9TD", day: "2026-10-13", validUntil, operatorName: "Parkair Lyon" });
const now = Date.parse("2026-10-13T21:50:00Z");

describe("joinCodeRefetchMs", () => {
  it("relit le code juste après minuit (heure du parking)", () => {
    expect(joinCodeRefetchMs(code("2026-10-13T22:00:00Z"), now)).toBe(10 * 60_000 + 2000);
  });

  it("au moins tous les quarts d'heure", () => {
    expect(joinCodeRefetchMs(code("2026-10-14T22:00:00Z"), now)).toBe(15 * 60_000);
  });

  it("un code déjà échu se redemande 5 secondes plus tard", () => {
    expect(joinCodeRefetchMs(code("2026-10-13T21:00:00Z"), now)).toBe(5000);
  });

  it("rien tant que le code n'est pas lu, un quart d'heure pour une date illisible", () => {
    expect(joinCodeRefetchMs(undefined, now)).toBe(false);
    expect(joinCodeRefetchMs(code("bientôt"), now)).toBe(15 * 60_000);
  });
});
