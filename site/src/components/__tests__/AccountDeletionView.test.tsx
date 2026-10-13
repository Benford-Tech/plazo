import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AccountDeletionView } from "../AccountDeletionView";
import { accountDeletionPage } from "@/lib/account-deletion";
import type { Company } from "@/lib/product";

const COMPANY: Company = {
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

describe("AccountDeletionView", () => {
  it("shows the title, the four steps with the app's words in bold, and what is erased or kept", () => {
    render(<AccountDeletionView page={accountDeletionPage(COMPANY, "support@example.com", "Plazo")} />);
    expect(screen.getByRole("heading", { level: 1, name: "Supprimer un compte Plazo Pro" })).toBeInTheDocument();
    const steps = screen.getByRole("heading", { level: 2, name: "Depuis l’application" }).closest("section")!;
    const items = within(steps).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Ouvrez Plazo Pro et connectez-vous.");
    expect(within(items[2]).getByText("Supprimer mon compte").tagName).toBe("STRONG");
    expect(screen.queryByText(/\*\*/)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Ce qui est effacé" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Ce qui reste" }).closest("section")).toHaveTextContent("« Compte supprimé »");
  });

  it("shows « [à compléter] » instead of a placeholder address, and a mail link once the real one is set", () => {
    const { unmount } = render(<AccountDeletionView page={accountDeletionPage(COMPANY, "support@example.com", "Plazo")} />);
    const contact = screen.getByRole("heading", { level: 2, name: "Sans l’application" }).closest("section")!;
    expect(contact).toHaveTextContent("E-mail : [à compléter]");
    expect(within(contact).queryByRole("link")).not.toBeInTheDocument();
    unmount();

    render(<AccountDeletionView page={accountDeletionPage(COMPANY, "contact@plazo.fr", "Plazo")} />);
    const mail = screen.getByRole("link", { name: "contact@plazo.fr" });
    expect(mail.getAttribute("href")).toMatch(/^mailto:contact@plazo\.fr\?subject=Supprimer%20un%20compte%20Plazo%20Pro$/);
  });

  it("links to Ma réservation and to the privacy policy for travellers", () => {
    render(<AccountDeletionView page={accountDeletionPage(COMPANY, "support@example.com", "Plazo")} />);
    expect(screen.getByRole("link", { name: "Ma réservation" })).toHaveAttribute("href", "/ma-reservation");
    expect(screen.getByRole("link", { name: "politique de confidentialité" })).toHaveAttribute("href", "/confidentialite");
  });
});
