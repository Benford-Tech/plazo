import { describe, expect, it } from "vitest";
import { ACCOUNT_DELETION_PATH, accountDeletionPage } from "../account-deletion";
import { TO_COMPLETE } from "../legal";
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

const all = (page: ReturnType<typeof accountDeletionPage>) =>
  [
    page.title,
    page.lead,
    ...page.steps.items,
    ...page.steps.notes,
    ...page.deleted.items,
    ...page.kept.items,
    ...page.definitive.paragraphs,
    ...page.travellers.paragraphs,
    page.contact.intro,
  ].join("\n");

describe("/suppression-compte (13/10/2026)", () => {
  it("names Plazo Pro from product.json and gives the path in the app", () => {
    const page = accountDeletionPage(EMPTY, "contact@plazo.fr", "Nouveau nom");
    expect(ACCOUNT_DELETION_PATH).toBe("/suppression-compte");
    expect(page.title).toBe("Supprimer un compte Nouveau nom Pro");
    expect(page.steps.items.join(" ")).toMatch(/\*\*Plus\*\*, puis \*\*Mon compte\*\*.*\*\*Supprimer mon compte\*\*/);
    expect(page.steps.items.at(-1)).toContain("**Apple**, **Google** ou votre **mot de passe**");
    expect(all(page)).not.toContain("Plazo Pro");
  });

  it("says what is erased, what stays as « Compte supprimé », and that travellers have no account", () => {
    const page = accountDeletionPage(EMPTY, "contact@plazo.fr", "Plazo");
    expect(page.deleted.items.join(" ")).toMatch(/prénom.*nom.*adresse e-mail.*téléphone/);
    expect(page.deleted.items.join(" ")).toContain("demande aussi à Apple de retirer l’accès");
    expect(page.kept.items.join(" ")).toContain("« Compte supprimé »");
    expect(page.steps.notes.join(" ")).toContain("Un trajet de navette en cours doit d’abord être terminé.");
    expect(page.travellers.paragraphs.join(" ")).toContain("Les voyageurs n’ont pas de compte Plazo");
    expect(page.travellers.paragraphs.join(" ")).toContain("[Ma réservation](/ma-reservation)");
    expect(page.definitive.paragraphs.join(" ")).toContain("**Quitter ce parking**");
  });

  it("gives the company's contact, « [à compléter] » until product.json is filled in", () => {
    const placeholder = accountDeletionPage(EMPTY, "support@example.com", "Plazo").contact;
    expect(placeholder).toMatchObject({ company: "Plazo Aéroports", email: null, address: TO_COMPLETE });
    const filled = accountDeletionPage({ ...EMPTY, address: "1 rue de l’Exemple, 69000 Lyon" }, "contact@plazo.fr", "Plazo").contact;
    expect(filled).toMatchObject({ email: "contact@plazo.fr", address: "1 rue de l’Exemple, 69000 Lyon" });
  });
});
