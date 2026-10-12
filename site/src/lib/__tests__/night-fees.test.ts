import { describe, expect, it } from "vitest";
import { formatShortEuros } from "../money";
import { basePriceOf, chargedNightFee, hasNightFee, nightFeeLabel, nightFeeParts, nightRuleSentence } from "../night-fees";
import type { NightRule } from "../types";

// French typography: a no-break space before « € ».
const euros = (cents: number) => formatShortEuros(cents);

describe("night fee line (direction B, 12/10/2026)", () => {
  it("names the end that pays, with its booked hour", () => {
    expect(nightFeeLabel({ arrivalCents: 1500, returnCents: 0, totalCents: 1500 }, "2026-10-13T23:30", "2026-10-20T18:00")).toBe("Frais de nuit · dépôt à 23:30");
    expect(nightFeeLabel({ arrivalCents: 0, returnCents: 1000, totalCents: 1000 }, "2026-10-13T08:00", "2026-10-20T05:30")).toBe("Frais de nuit · retour à 05:30");
  });

  it("names both ends when both pay (the fees add up)", () => {
    expect(nightFeeLabel({ arrivalCents: 1500, returnCents: 1500, totalCents: 3000 }, "2026-10-13T22:30", "2026-10-20T05:30")).toBe(
      "Frais de nuit · dépôt à 22:30 et retour à 05:30",
    );
  });

  it("keeps each hour apart, for the hours' mono face", () => {
    expect(nightFeeParts({ arrivalCents: 1500, returnCents: 1000, totalCents: 2500 }, "2026-10-13T22:30", "2026-10-20T05:30")).toEqual([
      { text: "Frais de nuit · " },
      { text: "dépôt à " },
      { hour: "22:30" },
      { text: " et " },
      { text: "retour à " },
      { hour: "05:30" },
    ]);
  });

  it("says nothing when the stay pays no night fee, or the API is older than night fees", () => {
    expect(nightFeeLabel(null, "2026-10-13T23:30", "2026-10-20T18:00")).toBeNull();
    expect(nightFeeLabel(undefined, "2026-10-13T23:30", "2026-10-20T18:00")).toBeNull();
    expect(nightFeeLabel({ arrivalCents: 0, returnCents: 0, totalCents: 0 }, "2026-10-13T23:30", "2026-10-20T18:00")).toBeNull();
    expect(chargedNightFee({ arrivalCents: 0, returnCents: 0, totalCents: 0 })).toBeNull();
  });
});

describe("package price (« Forfait N jours »)", () => {
  it("is the API's grid price, not the whole total", () => {
    expect(basePriceOf({ priceCents: 5160, basePriceCents: 3660, nightFee: { arrivalCents: 1500, returnCents: 0, totalCents: 1500 } })).toBe(3660);
  });

  it("falls back on the total less its night fee, or the total, with an older API", () => {
    expect(basePriceOf({ priceCents: 5160, nightFee: { arrivalCents: 1500, returnCents: 0, totalCents: 1500 } })).toBe(3660);
    expect(basePriceOf({ priceCents: 3660 })).toBe(3660);
    expect(basePriceOf({ priceCents: null, basePriceCents: null, nightFee: null })).toBeNull();
  });
});

describe("results with a night fee", () => {
  const fee = { arrivalCents: 1500, returnCents: 0, totalCents: 1500 };
  it("counts only bookable offers whose total includes a fee", () => {
    expect(hasNightFee({ available: true, priceCents: 5160, nightFee: fee })).toBe(true);
    expect(hasNightFee({ available: true, priceCents: 3660, nightFee: null })).toBe(false);
    expect(hasNightFee({ available: true, priceCents: 3660 })).toBe(false);
    expect(hasNightFee({ available: false, priceCents: 5160, nightFee: fee })).toBe(false);
    expect(hasNightFee({ available: true, priceCents: null, nightFee: fee })).toBe(false);
  });
});

describe("the parking's rule under the price lines", () => {
  const rule = (arrivalFeeCents: number | null, returnFeeCents: number | null): NightRule => ({ start: "22:00", end: "06:00", arrivalFeeCents, returnFeeCents });

  it("one amount for both ends", () => {
    expect(nightRuleSentence(rule(1500, 1500))).toBe(`Ce parking ajoute ${euros(1500)} pour un dépôt ou un retour entre 22:00 et 06:00.`);
    expect(euros(1500)).toBe("15\u00a0€");
  });

  it("two amounts", () => {
    expect(nightRuleSentence(rule(1500, 1000))).toBe(`Ce parking ajoute ${euros(1500)} pour un dépôt et ${euros(1000)} pour un retour entre 22:00 et 06:00.`);
  });

  it("one end only (the other unset or free)", () => {
    expect(nightRuleSentence(rule(1500, null))).toBe(`Ce parking ajoute ${euros(1500)} pour un dépôt entre 22:00 et 06:00.`);
    expect(nightRuleSentence(rule(0, 1250))).toBe(`Ce parking ajoute ${euros(1250)} pour un retour entre 22:00 et 06:00.`);
    expect(euros(1250)).toBe("12,50\u00a0€");
  });

  it("nothing without a rule or without an amount", () => {
    expect(nightRuleSentence(null)).toBeNull();
    expect(nightRuleSentence(undefined)).toBeNull();
    expect(nightRuleSentence(rule(null, null))).toBeNull();
    expect(nightRuleSentence(rule(0, 0))).toBeNull();
  });
});
