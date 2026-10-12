import {
  addMinutes,
  inNightWindow,
  NIGHT_TIMES,
  nightExamples,
  nightFeeOf,
  nightFees,
  nightRule,
  parseEuros,
  parseNightForm,
  parseRows,
  quoteCents,
  quoteReason,
  slugify,
  toNightForm,
} from "./pricing";

const tiers = [
  { days: 1, priceCents: 1500 },
  { days: 3, priceCents: 3499 },
  { days: 7, priceCents: 5900 },
  { days: 8, priceCents: 5500 },
];

describe("pricing", () => {
  it("prend le forfait le moins cher qui couvre le séjour", () => {
    expect(quoteCents(tiers, 600, 2)).toBe(3499);
    expect(quoteCents(tiers, 600, 5)).toBe(5500);
    expect(quoteReason(tiers, 600, 5)).toEqual({ kind: "tier", days: 8 });
  });

  it("ajoute le prix par jour au-delà du plus long forfait", () => {
    expect(quoteCents(tiers, 600, 10)).toBe(5500 + 2 * 600);
    expect(quoteReason(tiers, 600, 10)).toEqual({ kind: "extra", base: 8, extra: 2 });
    expect(quoteCents(tiers, null, 10)).toBeNull();
  });

  it("lit les montants en euros à la française", () => {
    expect(parseEuros("34,99")).toBe(3499);
    expect(parseEuros("34 €")).toBe(3400);
    expect(parseEuros("34,999")).toBeNull();
    expect(parseEuros("")).toBeNull();
  });

  it("signale les lignes invalides sans les compter", () => {
    expect(parseRows([{ days: "3", price: "34,99" }, { days: "0", price: "10" }])).toEqual({ tiers: [{ days: 3, priceCents: 3499 }], valid: false });
  });

  it("fabrique une adresse de page", () => {
    expect(slugify("Parking Démo LYS — Saint-Exupéry")).toBe("parking-demo-lys-saint-exupery");
  });
});

describe("frais de nuit (12/10/2026)", () => {
  const settings = { enabled: true, start: "22:00", end: "06:00", arrivalFeeCents: 1500, returnFeeCents: 1000 };
  const rule = nightRule(settings);

  it("compte le début comme la nuit, pas la fin, de part et d'autre de minuit", () => {
    expect(inNightWindow("22:00", "22:00", "06:00")).toBe(true);
    expect(inNightWindow("21:59", "22:00", "06:00")).toBe(false);
    expect(inNightWindow("00:00", "22:00", "06:00")).toBe(true);
    expect(inNightWindow("05:59", "22:00", "06:00")).toBe(true);
    expect(inNightWindow("06:00", "22:00", "06:00")).toBe(false);
    // A window within the day, and an empty one.
    expect(inNightWindow("01:30", "00:00", "05:00")).toBe(true);
    expect(inNightWindow("23:00", "00:00", "05:00")).toBe(false);
    expect(inNightWindow("22:00", "22:00", "22:00")).toBe(false);
  });

  it("n'a de règle qu'activée, avec deux heures différentes et un montant", () => {
    expect(rule).toEqual({ start: "22:00", end: "06:00", arrivalFeeCents: 1500, returnFeeCents: 1000 });
    expect(nightRule({ ...settings, enabled: false })).toBeNull();
    expect(nightRule({ ...settings, end: "22:00" })).toBeNull();
    expect(nightRule({ ...settings, start: null })).toBeNull();
    expect(nightRule({ ...settings, arrivalFeeCents: 0, returnFeeCents: null })).toBeNull();
    expect(nightRule({ ...settings, returnFeeCents: 0 })).toEqual({ start: "22:00", end: "06:00", arrivalFeeCents: 1500, returnFeeCents: null });
    expect(nightRule(undefined)).toBeNull();
  });

  it("additionne les frais des deux bouts du séjour", () => {
    expect(nightFees(rule, "23:30", "12:00")).toEqual({ arrivalCents: 1500, returnCents: 0, totalCents: 1500 });
    expect(nightFees(rule, "10:00", "05:30")).toEqual({ arrivalCents: 0, returnCents: 1000, totalCents: 1000 });
    expect(nightFees(rule, "22:30", "05:30")).toEqual({ arrivalCents: 1500, returnCents: 1000, totalCents: 2500 });
    expect(nightFees(rule, "06:00", "21:59")).toBeNull();
    expect(nightFees(null, "23:30", "05:30")).toBeNull();
  });

  it("lit les frais figés d'une réservation", () => {
    expect(nightFeeOf({ nightArrivalFeeCents: 1500, nightReturnFeeCents: null })).toEqual({ arrivalCents: 1500, returnCents: 0, totalCents: 1500 });
    expect(nightFeeOf({ nightArrivalFeeCents: null, nightReturnFeeCents: null })).toBeNull();
    expect(nightFeeOf({})).toBeNull();
  });

  it("propose des heures toutes les demi-heures et tourne autour de minuit", () => {
    expect(NIGHT_TIMES).toHaveLength(48);
    expect(NIGHT_TIMES[0]).toBe("00:00");
    expect(NIGHT_TIMES[47]).toBe("23:30");
    expect(addMinutes("23:30", 60)).toBe("00:30");
    expect(addMinutes("00:15", -30)).toBe("23:45");
  });

  it("tire trois séjours de la fenêtre, toujours dans la nuit", () => {
    expect(nightExamples(rule)).toEqual([
      { key: "arrival", days: 3, arrival: "23:30", return: null },
      { key: "return", days: 7, arrival: null, return: "05:30" },
      { key: "both", days: 7, arrival: "22:30", return: "05:30" },
    ]);
    // A short window keeps every time inside it.
    const short = nightRule({ ...settings, start: "23:00", end: "23:30" })!;
    for (const example of nightExamples(short)) {
      if (example.arrival) expect(inNightWindow(example.arrival, short.start, short.end)).toBe(true);
      if (example.return) expect(inNightWindow(example.return, short.start, short.end)).toBe(true);
    }
    // One side only: no example for the free side.
    expect(nightExamples(nightRule({ ...settings, returnFeeCents: null })).map(e => e.key)).toEqual(["arrival"]);
    expect(nightExamples(null)).toEqual([]);
  });

  it("prérempli 22:00 → 06:00 et lit le formulaire comme le serveur", () => {
    expect(toNightForm(undefined)).toEqual({ enabled: false, start: "22:00", end: "06:00", arrivalFee: "", returnFee: "" });
    const form = toNightForm(settings);
    expect(form).toEqual({ enabled: true, start: "22:00", end: "06:00", arrivalFee: "15,00", returnFee: "10,00" });
    expect(parseNightForm(form)).toEqual({ settings, errors: {} });
    expect(parseNightForm({ ...form, end: "22:00" }).errors).toEqual({ end: "same_time" });
    expect(parseNightForm({ ...form, arrivalFee: "", returnFee: "0" }).errors).toEqual({ arrivalFee: "fee_required", returnFee: "fee_required" });
    expect(parseNightForm({ ...form, arrivalFee: "abc" }).errors).toEqual({ arrivalFee: "invalid_fee" });
    expect(parseNightForm({ ...form, returnFee: "1000,01" }).errors).toEqual({ returnFee: "invalid_fee" });
    expect(parseNightForm({ ...form, returnFee: "1000" }).settings?.returnFeeCents).toBe(100000);
    // Switched off nothing blocks: the values are kept, an invalid fee is cleared.
    expect(parseNightForm({ ...form, enabled: false, end: "22:00", arrivalFee: "abc" })).toEqual({
      settings: { enabled: false, start: "22:00", end: "22:00", arrivalFeeCents: null, returnFeeCents: 1000 },
      errors: {},
    });
  });
});
