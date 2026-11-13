import { describe, expect, it } from "vitest";
import type { Dict } from "../../fr-dict";
import { DICTS } from "../dicts";
import { localizedPath, LOCALES, splitLocale } from "../locales";
import { withLocale } from "../runtime";
import { formatDateTimeAt, formatDay } from "../../dates";
import { errorMessage, fr } from "../../fr";
import { formatEuros } from "../../money";

/** Every key path of a texts tree, with the arity of its functions and the length of its arrays. */
function shape(node: unknown, path = ""): string[] {
  if (typeof node === "function") return [`${path}()${node.length}`];
  if (Array.isArray(node)) return [`${path}[${node.length}]`, ...node.flatMap((item, i) => (typeof item === "object" ? shape(item, `${path}[${i}]`) : []))];
  if (node && typeof node === "object") return Object.entries(node).flatMap(([key, value]) => shape(value, `${path}.${key}`));
  return [path];
}

describe("site languages (13/11/2026)", () => {
  it("every language has the French texts' keys, function arities and array lengths", () => {
    const reference = shape(DICTS.fr).sort();
    for (const locale of LOCALES) {
      const keys = shape(DICTS[locale] as Dict).sort();
      // Error codes may be added in a language without harm; nothing French may be missing.
      expect(reference.filter(k => !keys.includes(k)), locale).toEqual([]);
    }
  });

  it("puts every language but French under its prefix, and leaves the other services alone", () => {
    expect(localizedPath("fr", "/contact")).toBe("/contact");
    expect(localizedPath("en", "/contact")).toBe("/en/contact");
    expect(localizedPath("en", "/")).toBe("/en");
    expect(localizedPath("de", "/?arrivee=1")).toBe("/de?arrivee=1");
    expect(localizedPath("en", "/de/contact")).toBe("/en/contact");
    expect(localizedPath("en", "/pro/demo")).toBe("/pro/demo");
    expect(localizedPath("en", "/api/public/x")).toBe("/api/public/x");
    expect(localizedPath("en", "https://example.com/x")).toBe("https://example.com/x");
    expect(localizedPath("en", "#faq")).toBe("#faq");
    expect(splitLocale("/uk/ma-reservation")).toEqual({ locale: "uk", path: "/ma-reservation" });
    expect(splitLocale("/fr/contact")).toEqual({ locale: "fr", path: "/fr/contact" });
  });

  it("prints dates, prices and messages in the language being rendered", () => {
    expect(formatEuros(123456)).toBe("1 234,56 €");
    expect(formatDay("2026-10-04")).toBe("dim. 4 oct.");
    withLocale({ locale: "en", dict: DICTS.en }, () => {
      expect(formatEuros(123456)).toBe("€1,234.56");
      expect(formatDateTimeAt("2026-10-03T06:30")).toBe("Sat 3 Oct at 06:30");
      expect(fr.nav.myBooking).toBe(DICTS.en.nav.myBooking);
      expect(errorMessage("nope")).toBe(DICTS.en.errors.unknown);
    });
    withLocale({ locale: "de", dict: DICTS.de }, () => expect(formatEuros(123456)).toBe("1.234,56 €"));
    expect(fr.nav.myBooking).toBe(DICTS.fr.nav.myBooking);
  });
});
