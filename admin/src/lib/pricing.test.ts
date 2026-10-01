import { parseEuros, parseRows, quoteCents, quoteReason, slugify } from "./pricing";

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
