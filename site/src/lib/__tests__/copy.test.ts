import { describe, expect, it } from "vitest";
import { fr, frOnline, texts } from "../fr";

/** Every text of a (partial) copy tree, functions called with sample arguments. */
function strings(node: unknown): string[] {
  if (typeof node === "string") return [node];
  if (typeof node === "function") return [String((node as (...a: string[]) => unknown)("1er oct.", "34,99 €", "https://x"))];
  if (Array.isArray(node)) return node.flatMap(strings);
  if (node && typeof node === "object") return Object.values(node).flatMap(strings);
  return [];
}

const ON_SITE_WORDING = /sur place|rien à payer en ligne|rien à rembourser|rien n’est payé en ligne|ne payez rien en ligne|rien n’a été payé en ligne|réglez sur place/i;

describe("copy switching (online payment)", () => {
  it("payments off: the texts stay as they are", () => {
    expect(texts(false)).toBe(fr);
    expect(fr.home.faq[2][1]).toMatch(/Rien n’est payé en ligne/);
    expect(fr.parking.payOnSite).toBe("À payer sur place");
    expect(fr.booking.submit).toBe("Confirmer la réservation");
  });

  it("payments on: no « paid at the parking » wording left in the replaced texts", () => {
    const online = texts(true);
    for (const text of strings(frOnline)) expect(text).not.toMatch(ON_SITE_WORDING);
    expect(online.meta.defaultDescription).toContain("Paiement sécurisé par carte");
    expect(online.home.faq.find(([q]) => q === "Comment je paie ?")![1]).toMatch(/paiement sécurisé par carte sur/i);
    expect(online.home.faq.find(([q]) => q === "Puis-je annuler ?")![1]).toContain("remboursée intégralement sur votre carte sous 5 à 10 jours");
    expect(online.manage.cancelText("1er oct.")).toContain("remboursement intégral sur votre carte sous 5 à 10 jours");
    expect(online.manage.toPayOnSite).toBe("Payé");
    expect(online.booking.submit).toBe("Continuer vers le paiement");
    expect(online.calendar.description("R1", "34,99 €", "https://x")).toContain("34,99 € payés en ligne");
  });

  it("keeps every other text (and the price breakdown) unchanged", () => {
    const online = texts(true);
    expect(online.parking.serviceFee).toBe(fr.parking.serviceFee);
    expect(online.parking.packageLine(3)).toBe(fr.parking.packageLine(3));
    expect(online.home.faqTitle).toBe(fr.home.faqTitle);
    expect(online.errors).toBe(fr.errors);
  });
});
