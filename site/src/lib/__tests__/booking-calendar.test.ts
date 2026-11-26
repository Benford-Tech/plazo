import { describe, expect, it } from "vitest";
import { addMonths, crossesFull, monthGrid, pick, selectable } from "@/lib/booking-calendar";

describe("calendrier du module de réservation (26/11/2026)", () => {
  it("découpe un mois en semaines du lundi", () => {
    const weeks = monthGrid("2026-12");
    expect(weeks[0]).toEqual([null, "2026-12-01", "2026-12-02", "2026-12-03", "2026-12-04", "2026-12-05", "2026-12-06"]);
    expect(weeks.flat().filter(Boolean)).toHaveLength(31);
    expect(addMonths("2026-12", 1)).toBe("2027-01");
  });

  it("le premier toucher pose le dépôt, le second le retour, un jour d'avant recommence", () => {
    let range = pick({ from: null, to: null }, "2026-12-12");
    range = pick(range, "2026-12-20");
    expect(range).toEqual({ from: "2026-12-12", to: "2026-12-20" });
    expect(pick(range, "2026-12-14")).toEqual({ from: "2026-12-14", to: null });
    expect(pick({ from: "2026-12-12", to: null }, "2026-12-10")).toEqual({ from: "2026-12-10", to: null });
  });

  it("barre les jours passés, un dépôt complet et un retour qui traverse une nuit complète", () => {
    const full = new Set(["2026-12-24"]);
    const none = { from: null, to: null };
    expect(selectable(none, "2026-12-01", "2026-12-05", full)).toBe(false);
    expect(selectable(none, "2026-12-24", "2026-12-05", full)).toBe(false);
    expect(selectable(none, "2026-12-23", "2026-12-05", full)).toBe(true);
    const from = { from: "2026-12-20", to: null };
    expect(selectable(from, "2026-12-24", "2026-12-05", full)).toBe(true); // the return day is not a night
    expect(selectable(from, "2026-12-26", "2026-12-05", full)).toBe(false);
    expect(crossesFull("2026-12-25", "2026-12-28", full)).toBe(false);
  });
});
