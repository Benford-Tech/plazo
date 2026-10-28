import { addMonths, gaugeOf, monthGrids, mondayOf, periodLabel, periodOf, shiftPeriod } from "./forecast";

describe("planning prévisionnel : périodes", () => {
  it("semaine du lundi, mois civil et trois mois", () => {
    expect(mondayOf("2026-10-28")).toBe("2026-10-26");
    expect(mondayOf("2026-11-01")).toBe("2026-10-26");
    expect(periodOf("semaine", "2026-10-28")).toEqual({ from: "2026-10-26", days: 7 });
    expect(periodOf("mois", "2026-10-28")).toEqual({ from: "2026-10-01", days: 31 });
    expect(periodOf("3mois", "2026-10-28")).toEqual({ from: "2026-10-01", days: 92 });
    expect(periodOf("3mois", "2027-02-10")).toEqual({ from: "2027-02-01", days: 89 });
    expect(addMonths("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftPeriod("semaine", "2026-10-28", 1)).toBe("2026-11-02");
    expect(shiftPeriod("mois", "2026-10-28", -1)).toBe("2026-09-01");
    expect(shiftPeriod("3mois", "2026-10-28", 1)).toBe("2027-01-01");
    expect(periodLabel("mois", "2026-10-01", 31)).toBe("octobre 2026");
  });

  it("grilles du lundi au dimanche", () => {
    const [oct] = monthGrids("2026-10-01", 31);
    // 1 October 2026 is a Thursday: three blanks first.
    expect(oct.weeks[0]).toEqual([null, null, null, "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"]);
    expect(oct.weeks.every(w => w.length === 7)).toBe(true);
    expect(monthGrids("2026-10-01", 92).map(g => g.month)).toEqual(["2026-10-01", "2026-11-01", "2026-12-01"]);
  });

  it("jauge : couleurs et complet", () => {
    expect(gaugeOf({ parked: 50, bookable: 100 })).toEqual({ pct: 50, level: "low" });
    expect(gaugeOf({ parked: 75, bookable: 100 })).toEqual({ pct: 75, level: "mid" });
    expect(gaugeOf({ parked: 90, bookable: 100 })).toEqual({ pct: 90, level: "high" });
    expect(gaugeOf({ parked: 100, bookable: 100 }).level).toBe("full");
    expect(gaugeOf({ parked: 0, bookable: 0 })).toEqual({ pct: 0, level: "low" });
  });
});
