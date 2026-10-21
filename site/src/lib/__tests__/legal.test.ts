import { describe, expect, it } from "vitest";
import { legalNoticeDoc, privacyDoc, termsDoc, TO_COMPLETE, type LegalDoc } from "../legal";
import { COMPANY, type Company } from "../product";

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
    // The brand acts in the terms (collects, refunds, answers): it names the company too (15/10/2026).
    expect(text(termsDoc(FILLED, "x@plazo.fr", "Plazo"))).toContain("Dans ces conditions générales, « Plazo » désigne aussi cette société.");
  });

  it("the company of product.json has a VAT number that matches its SIREN (FR + key + SIREN)", () => {
    const siren = COMPANY.registration.replace(/\D/g, "");
    if (!siren || !COMPANY.vatNumber) return;
    expect(siren).toHaveLength(9);
    const key = (12 + 3 * (Number(siren) % 97)) % 97;
    expect(COMPANY.vatNumber).toBe(`FR${String(key).padStart(2, "0")}${siren}`);
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

  it("terms state the night fee rule (12/10/2026): in the total, on the booked hours, refunded with the stay", () => {
    const prices = termsDoc(EMPTY, "contact@plazo.fr", "Plazo").sections.find(s => s.id === "prix")!.blocks.join("\n");
    expect(prices).toContain("frais de nuit pour un dépôt, pour un retour, ou pour les deux");
    expect(prices).toContain("les deux frais s’ajoutent");
    expect(prices).toContain("compris dans le prix total affiché");
    expect(prices).toContain("calculés sur les heures de dépôt et de retour réservées et ne changent plus ensuite");
    expect(prices).toContain("remboursés avec le séjour");
    expect(termsDoc().version).toBe("21 octobre 2026"); // night fees (12/10/2026), the publisher's details (15/10/2026), the contract (19/10/2026), signed at the counter (20/10/2026), services for the car (21/10/2026)
  });

  it("points to the contact form only once the service client has a real address (footer A, 15/10/2026)", () => {
    const service = (email: string) => termsDoc(FILLED, email, "Plazo").sections.find(s => s.id === "editeur")!.blocks.join("\n");
    expect(service("contact@plazo.fr")).toContain("Service client : contact@plazo.fr · 04 00 00 00 00, ou par le [formulaire de contact](/contact).");
    expect(service("support@example.com")).not.toContain("formulaire de contact");
  });

  it("section ids are unique (anchors of the contents)", () => {
    for (const doc of [termsDoc(), legalNoticeDoc(), privacyDoc()]) {
      const ids = doc.sections.map(s => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe("privacy policy", () => {
  const all = text(privacyDoc(EMPTY, "contact@plazo.fr", "Plazo"));

  it("states the retention periods the code applies", () => {
    expect(all).toContain("jusqu’à 30 jours après le retour"); // MANAGE_LINK_DAYS_AFTER_RETURN
    expect(all).toContain("au plus tard 2 heures après le début"); // SIGNAL_MAX_MINUTES
    expect(all).toContain("Position GPS de la voiture : effacée 2 jours après le retour."); // purgeCarLocations
    expect(all).toContain("supprimés 2 jours après le retour"); // purgeDevices
    expect(all).toContain("File d’envoi des SMS (numéro du destinataire ; le texte n’est pas conservé) : 30 jours."); // SMS_OUTBOX_RETENTION_DAYS
    expect(all).toContain("12 mois après la date de retour"); // RESERVATION_RETENTION_MONTHS (backend/src/domain/retention.ts)
    expect(all).toContain("anonymisée automatiquement");
    expect(all).toContain("texte effacé après 30 jours, trace de réception supprimée après 90 jours"); // inbound emails (M-A)
  });

  it("covers the Plazo Pro sign-in with Apple or Google, the code of the day and account deletion (13/10/2026)", () => {
    expect(all).toContain("se connecter à Plazo Pro avec Apple (iPhone) ou Google (Android)");
    expect(all).toContain("jamais son mot de passe Apple ou Google");
    // JoinRequestService.purge: identities not linked to a member (never joined, or left), idle for 30 days.
    expect(all).toContain("si elle n’est liée à aucun parking (jamais rejoint, ou quitté), supprimée avec ses demandes après 30 jours sans connexion ni demande");
    expect(all).toContain("sans réponse d’un gérant, elle expire au bout de 7 jours"); // JOIN_REQUEST_DAYS
    expect(all).toContain("le code tapé n’est jamais enregistré) : 7 jours."); // join_attempts purge
    expect(all).toContain("[Supprimer un compte Plazo Pro](/suppression-compte)");
    expect(all).toContain("« Compte supprimé »");
    expect(all).toContain("Apple et Google");
    expect(all).toContain("ils confirment son identité à Plazo");
    expect(privacyDoc().version).toBe("21 octobre 2026"); // the demo link (21/10/2026), 13/10/2026, the controller's details (15/10/2026), prospecting (18/10/2026), the condition reports (19/10/2026), the traveller's own photos (20/10/2026)
  });

  it("says what really happens: a raw IP kept 7 days for the code, Google's id is not Plazo's own, Apple revoked only with Apple", () => {
    // join_attempts.ipKey (the IPv4, or the IPv6 /64) is kept in the database with the attempt.
    // The API's limits keep a visitor's key up to two windows (express-rate-limit's memory store), the longest window being an hour.
    expect(all).toContain("Adresse IP : en mémoire pour limiter les abus, deux heures au plus (7 jours pour les essais du code du jour de Plazo Pro)");
    // Apple's `sub` is per team; Google's is the account's global id.
    expect(all).toContain("un identifiant de compte (chez Apple, propre à Plazo)");
    expect(all).not.toContain("un identifiant propre à Plazo");
    // The backend revokes at Apple only when an authorisation code comes with the deletion.
    expect(all).toContain("Lorsqu’un membre confirme la suppression de son compte avec Apple, Plazo demande aussi à Apple de retirer l’accès");
    expect(all).toContain("lorsque la suppression est confirmée avec Apple, Plazo demande aussi à Apple");
    expect(all).not.toContain("pour un compte lié à Apple");
    // Handover remarks signed with the first name (ReservationService.applyStatus) stay in the booking's notes.
    expect(all).toContain("les remarques écrites dans les notes d’une réservation, signées du prénom, y restent jusqu’à l’anonymisation de la réservation (12 mois après le retour)");
  });

  it("dates each text on its own: the three moved on 15/10/2026 with the company details of product.json, the privacy policy on 18/10/2026, terms and privacy on 19/10/2026", () => {
    expect(privacyDoc().version).toBe("21 octobre 2026");
    expect(termsDoc().version).toBe("21 octobre 2026");
    expect(legalNoticeDoc().version).toBe("15 octobre 2026");
  });

  it("covers the signed contract and the condition reports (19/10/2026)", () => {
    // PaperworkService: SMS code (masked phone) or handwritten signature, photos erased 90 days after the return (365 with
    // a reservation), the drop-off report accepted by default once the traveller left in the shuttle, codes kept hashed a day.
    expect(all).toContain("dont seuls les deux premiers et deux derniers chiffres du numéro sont gardés");
    expect(all).toContain("Photos de l’état des lieux : effacées 90 jours après la date de retour, ou 12 mois après si vous avez fait une réserve");
    expect(all).toContain("Vercel Blob (stockage privé des photos de l’état des lieux");
    expect(all).toContain("Code de signature envoyé par SMS : seule son empreinte est gardée, 24 heures au plus.");
    const terms = termsDoc()
      .sections.flatMap((s) => s.blocks)
      .flat()
      .join("\n");
    expect(terms).toContain("sans réponse de sa part avant son départ en navette, l’état des lieux du dépôt vaut accord");
    expect(terms).toContain("le voyageur le signe pour accord ou y inscrit une réserve");
  });

  it("covers the prospecting of airport parkings (Plateforme › Prospection, 18/10/2026)", () => {
    // ProspectingService: source manual | csv, 3 steps stopped by a reply, the opt-out link, suppressions kept hashed,
    // the nightly purge 3 years after the last contact (RETENTION_YEARS).
    expect(all).toContain("saisies à la main par l’équipe de Plazo ou importées d’un fichier qu’elle fournit");
    expect(all).toContain("Trois messages au plus (un premier contact et deux relances), qui s’arrêtent dès que le parking répond");
    expect(all).toContain("« Ne plus recevoir de messages »");
    expect(all).toContain("gardée sous forme d’empreinte");
    expect(all).toContain("supprimées 3 ans après le dernier contact");
  });

  it("covers the contact form and « La lettre » of footer A (15/10/2026)", () => {
    expect(all).toContain("par e-mail ou par le formulaire de contact du site : vos prénom et nom, votre adresse e-mail, la référence de votre réservation si vous l’indiquez, votre message");
    // The API sends the message by e-mail (Brevo) and keeps nothing (POST /public/contact).
    expect(all).toContain("transmis par e-mail au service client de Plazo, il n’est pas gardé par le site ni par ses serveurs au-delà de cet envoi");
    // Brevo double opt-in: consent, confirmation by e-mail, one-click unsubscribe, kept until then.
    expect(all).toContain("Vous envoyer la lettre Plazo (nouveaux aéroports, nouveaux parkings et offres de saison) : votre consentement");
    expect(all).toContain("en confirmant par le lien reçu par e-mail");
    expect(all).toContain("votre adresse reste inscrite chez Brevo jusqu’à votre désinscription, en un clic depuis chaque lettre");
    expect(all).toContain("une inscription que vous ne confirmez pas n’est ajoutée à aucune liste");
    // Brevo keeps an unsubscribed address, blocklisted, so as not to write to it again: the policy says so.
    expect(all).toContain("Après une désinscription, Brevo garde l’adresse marquée comme désinscrite, seulement pour ne plus vous écrire");
    // newsletterAddressLimiter: a hash of the address, a 24 h window, so 48 h at most in memory.
    expect(all).toContain("son empreinte reste en mémoire 48 heures au plus");
    expect(all).toContain("la lettre Plazo ne part qu’aux adresses inscrites et confirmées");
    expect(all).toContain("pour la lettre, le lien de désinscription de chaque lettre suffit");
  });

  it("names the recipients and the authority, and keeps its promises narrow", () => {
    for (const name of ["Vercel", "Neon", "Stripe", "Brevo", "OneSignal", "SMS Gateway for Android", "IGN", "CNIL"]) expect(all).toContain(name);
    expect(all).toContain("ne vend pas vos données");
    expect(all).toContain("aucun cookie publicitaire");
    expect(all).toContain(`région ${TO_COMPLETE}`);
  });
});
