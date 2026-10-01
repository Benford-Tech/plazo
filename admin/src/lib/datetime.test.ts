import { addDays, localParts, longDate, nightsBetween, shortDay } from "@/lib/datetime";

describe("dates du parking", () => {
  it("affiche l'heure de Paris quelle que soit la saison", () => {
    expect(localParts("2026-10-04T04:30:00.000Z")).toEqual({ date: "2026-10-04", time: "06:30" });
    expect(localParts("2026-12-04T05:30:00.000Z")).toEqual({ date: "2026-12-04", time: "06:30" });
    expect(localParts("2026-10-03T22:30:00.000Z").date).toBe("2026-10-04");
  });

  it("formate les jours en français", () => {
    expect(longDate("2026-10-01")).toBe("Jeudi 1 octobre");
    expect(shortDay("2026-10-04")).toBe("dim. 4");
  });

  it("compte les nuits et les jours", () => {
    expect(nightsBetween("2026-10-04", "2026-10-11")).toBe(7);
    expect(nightsBetween("2026-10-04", "2026-10-04")).toBe(1);
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
  });
});
