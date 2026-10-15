import { describe, expect, it } from "vitest";
import { currentYear, footerConfig, type FooterSource, legalLine, lowerFirst, socialUrl, supportPhone } from "../footer";
import { fr } from "../fr";
import { COMPANY, NEWSLETTER, SOCIAL, SUPPORT } from "../product";

const COMPANY_EMPTY = { ...COMPANY, name: "", legalForm: "", registration: "", vatNumber: "" };

const none: FooterSource = {
  support: { phone: "", hours: "", responseTime: "" },
  social: { instagram: "", facebook: "", linkedin: "" },
  newsletter: false,
  supportEmail: "support@example.com",
  company: COMPANY,
};

const all: FooterSource = {
  support: { phone: "04 78 00 00 00", hours: "Du lundi au vendredi, de 9 h à 18 h", responseTime: "48 h" },
  social: { instagram: "https://www.instagram.com/plazo", facebook: "https://www.facebook.com/plazo", linkedin: " https://www.linkedin.com/company/plazo " },
  newsletter: true,
  supportEmail: "aide@plazo.fr",
  company: COMPANY,
};

describe("footer config (A, 15/10/2026)", () => {
  it("product.json has the footer keys, empty until Joanny gives them", () => {
    expect(SUPPORT).toEqual({ phone: "", hours: "", responseTime: "" });
    expect(SOCIAL).toEqual({ instagram: "", facebook: "", linkedin: "" });
    expect(NEWSLETTER).toBe(false);
    // Today: nothing to show but the payment row and the legal line.
    expect(footerConfig()).toMatchObject({ phone: null, contactForm: null, social: [], newsletter: false });
  });

  it("hides every block whose facts are not given (placeholder support address included)", () => {
    expect(footerConfig(none)).toEqual({ phone: null, contactForm: null, social: [], newsletter: false, company: COMPANY });
  });

  it("shows the configured ones, trimmed, in a fixed order", () => {
    const config = footerConfig(all);
    expect(config.phone).toEqual({ display: "04 78 00 00 00", href: "tel:0478000000", hours: "Du lundi au vendredi, de 9 h à 18 h" });
    expect(config.contactForm).toEqual({ responseTime: "48 h" });
    expect(config.social.map(s => [s.network, s.label, s.url])).toEqual([
      ["instagram", "Instagram", "https://www.instagram.com/plazo"],
      ["facebook", "Facebook", "https://www.facebook.com/plazo"],
      ["linkedin", "LinkedIn", "https://www.linkedin.com/company/plazo"],
    ]);
    expect(config.newsletter).toBe(true);
  });

  it("a phone without hours, a form without delay, a single social account", () => {
    const config = footerConfig({ ...all, support: { phone: "+33478000000", hours: " ", responseTime: "" }, social: { ...none.social, linkedin: "https://linkedin.com/company/plazo" } });
    expect(config.phone).toEqual({ display: "+33 4 78 00 00 00", href: "tel:+33478000000", hours: null });
    expect(config.contactForm).toEqual({ responseTime: null });
    expect(config.social.map(s => s.network)).toEqual(["linkedin"]);
  });

  it("only takes a real phone number and https addresses", () => {
    expect(supportPhone("")).toBeNull();
    expect(supportPhone("à compléter")).toBeNull();
    expect(supportPhone("12 34")).toBeNull();
    expect(supportPhone("04.78.00.00.00")).toEqual({ display: "04 78 00 00 00", href: "tel:0478000000" });
    expect(socialUrl("")).toBeNull();
    expect(socialUrl("instagram.com/plazo")).toBeNull();
    expect(socialUrl("http://www.instagram.com/plazo")).toBeNull();
    expect(socialUrl("javascript:alert(1)")).toBeNull();
    expect(socialUrl("https://www.instagram.com/plazo")).toBe("https://www.instagram.com/plazo");
  });

  it("reads the hours after « Notre équipe vous répond »", () => {
    expect(lowerFirst("Du lundi au vendredi, de 9 h à 18 h")).toBe("du lundi au vendredi, de 9 h à 18 h");
    expect(lowerFirst("TLJ de 8 h à 20 h")).toBe("TLJ de 8 h à 20 h");
    expect(fr.help.leadHours(lowerFirst("Du lundi au vendredi, de 9 h à 18 h"))).toBe("Notre équipe vous répond du lundi au vendredi, de 9 h à 18 h.");
  });

  it("writes the legal line from product.json, never « [à compléter] »", () => {
    expect(legalLine(COMPANY, 2026, fr.footer.rights, fr.footer.vat, "Plazo")).toEqual({
      copyright: "© 2026 Benford Tech · Tous droits réservés",
      identity: "Société par actions simplifiée · 910 729 102 RCS Vienne · TVA FR55910729102",
    });
    expect(legalLine(COMPANY_EMPTY, 2027, fr.footer.rights, fr.footer.vat, "Plazo")).toEqual({ copyright: "© 2027 Plazo · Tous droits réservés", identity: null });
    expect(legalLine({ ...COMPANY_EMPTY, vatNumber: "FR55910729102" }, 2026, fr.footer.rights, fr.footer.vat).identity).toBe("TVA FR55910729102");
  });

  it("takes the year on the parkings' clock", () => {
    expect(currentYear(new Date("2026-12-31T22:30:00Z"))).toBe(2026);
    expect(currentYear(new Date("2026-12-31T23:30:00Z"))).toBe(2027);
  });
});
