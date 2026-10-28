import { describe, expect, it } from "vitest";
import { isProHost } from "../pro-host";
import { PRO_PLANS } from "../pro-pricing";
import { proSoftwareLd } from "../structured-data";

describe("Plazo Pro SEO (28/10/2026)", () => {
  it("recognises pro.plazo.fr whatever the port or case", () => {
    expect(isProHost("pro.plazo.fr")).toBe(true);
    expect(isProHost("PRO.plazo.fr:443")).toBe(true);
    expect(isProHost("www.plazo.fr")).toBe(false);
    expect(isProHost(null)).toBe(false);
  });

  it("describes the software with its plans' monthly prices, excluding VAT", () => {
    type Offer = { priceSpecification: { valueAddedTaxIncluded: boolean } };
    const ld = proSoftwareLd("https://pro.plazo.fr/", PRO_PLANS, "Benford Tech") as {
      "@type": string;
      name: string;
      offers: { lowPrice: number; highPrice: number; offers: Offer[] };
      publisher: { name: string };
    };
    expect(ld["@type"]).toBe("SoftwareApplication");
    expect(ld.name).toBe("Plazo Pro");
    expect(ld.offers.lowPrice).toBe(79);
    expect(ld.offers.highPrice).toBe(229);
    expect(ld.offers.offers).toHaveLength(3);
    expect(ld.offers.offers[0].priceSpecification.valueAddedTaxIncluded).toBe(false);
    expect(ld.publisher.name).toBe("Benford Tech");
  });
});
