import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FormState } from "@/lib/forms";

const { pathname, newsletterAction } = vi.hoisted(() => ({
  pathname: { current: "/" },
  newsletterAction: vi.fn<(state: FormState, data: FormData) => Promise<FormState>>(),
}));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));
vi.mock("@/lib/contact-actions", () => ({ newsletterAction, contactAction: vi.fn() }));

import { SiteFooter } from "../SiteFooter";
import { footerConfig, type FooterSource } from "@/lib/footer";
import { COMPANY } from "@/lib/product";

const none: FooterSource = {
  support: { phone: "", hours: "", responseTime: "" },
  social: { instagram: "", facebook: "", linkedin: "" },
  newsletter: false,
  supportEmail: "support@example.com",
  company: COMPANY,
};

const all: FooterSource = {
  support: { phone: "04 78 00 00 00", hours: "Du lundi au vendredi, de 9 h à 18 h", responseTime: "48 h" },
  social: { instagram: "https://www.instagram.com/plazo", facebook: "", linkedin: "https://www.linkedin.com/company/plazo" },
  newsletter: true,
  supportEmail: "aide@plazo.fr",
  company: COMPANY,
};

function help() {
  return screen.getByRole("region", { name: "Une question sur votre réservation ?" });
}

describe("SiteFooter (A, 15/10/2026)", () => {
  beforeEach(() => {
    pathname.current = "/";
    newsletterAction.mockReset();
  });

  it("without any support fact: the help card keeps its title, a short text, the note and two quiet links", () => {
    render(<SiteFooter config={footerConfig(none)} year={2026} />);
    const card = help();
    expect(within(card).getByText("Besoin d’aide ?")).toBeInTheDocument();
    expect(card).toHaveTextContent("Votre réservation se retrouve en ligne avec sa référence et votre e-mail");
    expect(card).toHaveTextContent("Le jour du départ, appelez directement le parking : son numéro est dans votre confirmation et dans « Ma réservation ».");
    expect(within(card).getByRole("link", { name: "Retrouver ma réservation" })).toHaveAttribute("href", "/ma-reservation");
    expect(within(card).getByRole("link", { name: "Questions fréquentes" })).toHaveAttribute("href", "/#faq");
    expect(within(card).queryByText("Par téléphone")).not.toBeInTheDocument();
    expect(within(card).queryByRole("link", { name: "Nous écrire" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Nous contacter" })).not.toBeInTheDocument();
    // Nothing made up, nothing to complete.
    expect(document.body.textContent).not.toMatch(/à compléter|\[|lundi|example\.com/);
  });

  it("always shows the payment means, the pro login and the legal line; no socials nor letter while not configured", () => {
    render(<SiteFooter config={footerConfig(none)} year={2026} />);
    const footer = screen.getByRole("contentinfo");
    const chips = within(footer).getByRole("list", { name: "Moyens de paiement acceptés" });
    expect(within(chips).getAllByRole("listitem").map(li => li.textContent)).toEqual(["CB", "Visa", "Mastercard", "Apple Pay", "Google Pay"]);
    expect(footer).toHaveTextContent("Payé en ligne à la réservation, par Stripe. Rien à régler au parking.");
    expect(within(footer).getByRole("link", { name: "Se connecter à l’espace loueur" })).toHaveAttribute("href", "/pro/login");
    expect(within(footer).getByRole("link", { name: "Vous êtes un parking ?" })).toHaveAttribute("href", "/loueurs");
    expect(footer).toHaveTextContent("© 2026 Benford Tech · Tous droits réservés");
    expect(footer).toHaveTextContent("Société par actions simplifiée · 910 729 102 RCS Vienne · TVA FR55910729102");
    expect(within(footer).queryByText("Suivez-nous")).not.toBeInTheDocument();
    expect(within(footer).queryByLabelText("La lettre Plazo")).not.toBeInTheDocument();
    // The header's « Aéroports » link lands on this column.
    expect(footer.querySelector("#aeroports")).toHaveTextContent("Lyon Saint-Exupéry");
  });

  it("with every fact: the phone tile with its tel: link, the written tile to /contact, the socials and the letter", () => {
    render(<SiteFooter config={footerConfig(all)} year={2026} />);
    const card = help();
    expect(card).toHaveTextContent("Notre équipe vous répond du lundi au vendredi, de 9 h à 18 h.");
    expect(within(card).getByText("04 78 00 00 00")).toBeInTheDocument();
    expect(within(card).getByText("Du lundi au vendredi, de 9 h à 18 h")).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: "Appeler le service client" })).toHaveAttribute("href", "tel:0478000000");
    expect(within(card).getByText("Formulaire de contact")).toBeInTheDocument();
    expect(card).toHaveTextContent("Réponse par e-mail sous 48 h.");
    expect(within(card).getByRole("link", { name: "Nous écrire" })).toHaveAttribute("href", "/contact");
    expect(within(card).queryByRole("link", { name: "Retrouver ma réservation" })).not.toBeInTheDocument();

    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByRole("link", { name: "Nous contacter" })).toHaveAttribute("href", "/contact");
    expect(within(footer).getByRole("link", { name: "Plazo sur Instagram" })).toHaveAttribute("href", "https://www.instagram.com/plazo");
    expect(within(footer).getByRole("link", { name: "Plazo sur LinkedIn" })).toHaveAttribute("href", "https://www.linkedin.com/company/plazo");
    expect(within(footer).queryByRole("link", { name: "Plazo sur Facebook" })).not.toBeInTheDocument();
    expect(within(footer).getByLabelText("La lettre Plazo")).toHaveAttribute("type", "email");
    // What the letter is and the consent are read with the field, before « S'inscrire ».
    expect(within(footer).getByLabelText("La lettre Plazo")).toHaveAccessibleDescription(
      /Nouveaux aéroports, nouveaux parkings et offres de saison\. En vous inscrivant, vous acceptez de recevoir la lettre Plazo par e-mail/,
    );
    expect(footer).toHaveTextContent("En vous inscrivant, vous acceptez de recevoir la lettre Plazo par e-mail ; votre adresse ne sert qu’à cela.");
    expect(footer).toHaveTextContent("Désinscription en un clic, dans chaque lettre.");
  });

  it("a written tile without delay, a phone without hours", () => {
    render(<SiteFooter config={footerConfig({ ...all, support: { phone: "0478000000", hours: "", responseTime: "" } })} year={2026} />);
    const card = help();
    expect(card).toHaveTextContent("Notre équipe vous répond par téléphone ou par écrit.");
    expect(card).toHaveTextContent("Réponse par e-mail.");
    expect(card).not.toHaveTextContent("sous");
  });

  it("does not repeat the help card under the contact form", () => {
    pathname.current = "/contact";
    render(<SiteFooter config={footerConfig(all)} year={2026} />);
    expect(screen.queryByRole("region", { name: "Une question sur votre réservation ?" })).not.toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("the letter: sent through the action, then the confirmation note; an error in a light box", async () => {
    newsletterAction.mockResolvedValueOnce({ values: { email: "camille@" }, fields: { email: "invalid_email" }, error: "validation_failed" });
    newsletterAction.mockResolvedValueOnce({ values: {}, fields: {}, error: null, notice: "newsletter_sent" });
    render(<SiteFooter config={footerConfig(all)} year={2026} />);
    const input = screen.getByLabelText("La lettre Plazo");
    await userEvent.type(input, "camille@");
    await userEvent.click(screen.getByRole("button", { name: "S’inscrire" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Adresse email invalide.");
    expect(screen.getByLabelText("La lettre Plazo")).toHaveAttribute("aria-invalid", "true");
    expect((newsletterAction.mock.calls[0][1] as FormData).get("email")).toBe("camille@");
    expect((newsletterAction.mock.calls[0][1] as FormData).get("website")).toBe("");

    await userEvent.clear(screen.getByLabelText("La lettre Plazo"));
    await userEvent.type(screen.getByLabelText("La lettre Plazo"), "camille@example.com");
    await userEvent.click(screen.getByRole("button", { name: "S’inscrire" }));
    expect(await screen.findByText(/Confirmez votre inscription avec le lien/)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
