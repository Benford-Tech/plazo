import { describe, expect, it } from "vitest";
import { formatEuros } from "../money";
import { commissionExample, quote, selectionSummary } from "../pro-pricing";

describe("Plazo Pro pricing", () => {
  it("totals the plan, the monthly options and the one-off ones", () => {
    const q = quote({ plan: "operations", yearly: false, marketplace: true, options: ["setup", "booking_page"] });
    expect(q.monthlyCents).toBe(14900 + 2900);
    expect(q.periodCents).toBe(17800);
    expect(q.onceCents).toBe(29000);
    expect(q.lines.map(l => l.kind)).toEqual(["monthly", "commission", "once", "monthly"]);
  });

  it("billed yearly: 10 % off every monthly price, twelve months at a time, one-off prices untouched", () => {
    const q = quote({ plan: "complet", yearly: true, marketplace: false, options: ["sms", "booking_page"] });
    expect(q.lines[0]).toMatchObject({ cents: 20610, fullCents: 22900 });
    expect(q.monthlyCents).toBe(20610 + 2610);
    expect(q.periodCents).toBe((20610 + 2610) * 12);
    expect(q.onceCents).toBe(4900);
    expect(q.lines.some(l => l.kind === "commission")).toBe(false);
  });

  it("falls back to the recommended plan and leaves out unknown and « soon » options", () => {
    const q = quote({ plan: "x" as never, yearly: false, marketplace: false, options: ["second_parking", "nope" as never] });
    expect(q.lines).toEqual([{ label: "Logiciel Opérations", cents: 14900, kind: "monthly" }]);
  });

  it("words the selection for the quote request", () => {
    const text = selectionSummary({ plan: "essentiel", yearly: true, marketplace: true, options: ["setup"] }, formatEuros);
    expect(text).toContain("Facturation : annuelle");
    expect(text).toContain("Logiciel Essentiel : 71,10");
    expect(text).toContain("Fiche sur Plazo : 15 % par réservation payée sur Plazo");
    expect(text).toContain("Mise en route sur place : 290,00 € une fois");
    expect(text).toMatch(/Total : 853,20.€ HT par an/);
  });

  it("the commission example: 15 % of a 60 € week", () => {
    expect(commissionExample()).toEqual({ priceCents: 6000, commissionCents: 900, netCents: 5100 });
  });
});
