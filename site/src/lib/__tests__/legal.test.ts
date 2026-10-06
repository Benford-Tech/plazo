import { describe, expect, it } from "vitest";
import { legalNoticeDoc, termsDoc, TO_COMPLETE, type LegalDoc } from "../legal";
import type { Company } from "../product";

const EMPTY: Company = {
  name: "Plazo Aéroports",
  legalForm: "",
  shareCapital: "",
  address: "",
  registration: "",
  vatNumber: "",
  phone: "",
  publicationDirector: "",
  mediator: "",
};

const FILLED: Company = {
  name: "Plazo Aéroports",
  legalForm: "SAS",
  shareCapital: "1 000 €",
  address: "1 rue de l’Exemple, 69000 Lyon",
  registration: "RCS Lyon 123 456 789",
  vatNumber: "FR00123456789",
  phone: "04 00 00 00 00",
  publicationDirector: "Camille Martin",
  mediator: "Médiateur Exemple, mediateur.example",
};

const text = (doc: LegalDoc) => [doc.title, doc.lead, ...doc.sections.flatMap(s => [s.title, ...s.blocks.flat()])].join("\n");

describe("legal pages", () => {
  it("name the product and the company from product.json, never the text they were adapted from", () => {
    for (const doc of [termsDoc(EMPTY, "contact@plazo.fr", "Plazo"), legalNoticeDoc(EMPTY, "contact@plazo.fr", "Plazo")]) {
      const all = text(doc);
      expect(all).toContain("Plazo Aéroports");
      expect(all).not.toMatch(/allopark|gr4|luxembourg/i);
    }
    expect(text(termsDoc(EMPTY, "x@plazo.fr", "Nouveau nom"))).toContain("Nouveau nom est une plateforme de réservation");
  });

  it("show what is still to provide, and nothing once the company details are filled in", () => {
    expect(text(legalNoticeDoc(EMPTY, "support@example.com"))).toContain(`E-mail : ${TO_COMPLETE}`);
    expect(text(termsDoc(EMPTY, "contact@plazo.fr"))).toContain(`numéro de TVA intracommunautaire ${TO_COMPLETE}`);
    for (const doc of [termsDoc(FILLED, "contact@plazo.fr"), legalNoticeDoc(FILLED, "contact@plazo.fr")]) {
      expect(text(doc)).not.toContain(TO_COMPLETE);
    }
    expect(text(legalNoticeDoc(FILLED, "contact@plazo.fr"))).toContain("Directeur de la publication : Camille Martin.");
  });

  it("terms follow the product: paid online, the four cancellation policies, no fee added", () => {
    const terms = termsDoc(EMPTY, "contact@plazo.fr", "Plazo");
    const all = text(terms);
    expect(all).not.toMatch(/payé sur place|paiement sur place|à payer au parking/i);
    expect(all).toContain("Rien n’est à régler au parking pour la prestation réservée.");
    expect(all).toContain("Plazo n’ajoute aucun frais de service");
    expect(all).toContain("pendant 30 minutes");
    const policies = terms.sections.find(s => s.id === "annulation")!.blocks.find(Array.isArray)!;
    expect(policies).toHaveLength(4);
    expect(policies.join(" ")).toMatch(/jusqu’à l’heure de dépôt.*24 heures.*48 heures.*non annulable/);
  });

  it("section ids are unique (anchors of the contents)", () => {
    for (const doc of [termsDoc(), legalNoticeDoc()]) {
      const ids = doc.sections.map(s => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
