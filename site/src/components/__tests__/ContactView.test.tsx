import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ContactView } from "../ContactView";
import { footerConfig, type FooterSource } from "@/lib/footer";
import type { FormState } from "@/lib/forms";
import { COMPANY } from "@/lib/product";

const base: FooterSource = {
  support: { phone: "", hours: "", responseTime: "" },
  social: { instagram: "", facebook: "", linkedin: "" },
  newsletter: false,
  supportEmail: "support@example.com",
  company: COMPANY,
};

describe("ContactView (/contact, 15/10/2026)", () => {
  it("without a real support address: not open yet, with « Ma réservation » and the FAQ", () => {
    render(<ContactView config={footerConfig(base)} action={vi.fn()} />);
    expect(screen.getByRole("heading", { level: 1, name: "Nous contacter" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Le formulaire de contact arrive bientôt" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Retrouver ma réservation" })).toHaveAttribute("href", "/ma-reservation");
    expect(screen.getByRole("link", { name: "Questions fréquentes" })).toHaveAttribute("href", "/#faq");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByText("Par téléphone")).not.toBeInTheDocument();
  });

  it("with the address: the form, then a confirmation that takes the focus", async () => {
    const action = vi.fn<(state: FormState, data: FormData) => Promise<FormState>>();
    action.mockResolvedValueOnce({
      values: { name: "Camille Martin", email: "camille@example.com", reference: "", message: "Bonjour" },
      fields: { message: "message_too_short" },
      error: "validation_failed",
    });
    action.mockResolvedValueOnce({ values: {}, fields: {}, error: null, notice: "contact_sent" });
    const config = footerConfig({ ...base, supportEmail: "aide@plazo.fr", support: { phone: "04 78 00 00 00", hours: "", responseTime: "48 h" } });
    render(<ContactView config={config} action={action} />);
    expect(screen.getByText(/notre équipe vous répond par e-mail sous 48 h\./)).toBeInTheDocument();
    const phone = screen.getByRole("region", { name: "Par téléphone" });
    expect(within(phone).getByRole("link", { name: "Appeler le service client" })).toHaveAttribute("href", "tel:0478000000");

    await userEvent.type(screen.getByLabelText("Prénom et nom"), "Camille Martin");
    await userEvent.type(screen.getByLabelText("E-mail"), "camille@example.com");
    await userEvent.type(screen.getByLabelText("Votre message"), "Bonjour");
    await userEvent.click(screen.getByRole("button", { name: "Envoyer le message" }));
    expect(await screen.findByText("10 caractères au moins.")).toBeInTheDocument();
    expect(screen.getByLabelText("Votre message")).toHaveAttribute("aria-invalid", "true");
    // The first invalid field takes the focus: its label and its error are read out.
    expect(screen.getByLabelText("Votre message")).toHaveFocus();
    expect(screen.getByLabelText("Votre message")).toHaveAccessibleDescription(/10 caractères au moins\./);
    expect(screen.getByLabelText("Votre message")).toHaveValue("Bonjour");
    const sent = action.mock.calls[0][1] as FormData;
    expect([sent.get("name"), sent.get("email"), sent.get("website")]).toEqual(["Camille Martin", "camille@example.com", ""]);

    await userEvent.type(screen.getByLabelText("Votre message"), ", ma réservation RAB234 ?");
    await userEvent.click(screen.getByRole("button", { name: "Envoyer le message" }));
    expect(await screen.findByText("Message envoyé")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Merci, notre équipe vous répond par e-mail sous 48 h.");
    expect(screen.queryByRole("button", { name: "Envoyer le message" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Écrire un autre message" }));
    expect(screen.getByLabelText("Votre message")).toHaveValue("");
  });

  it("shows the API's general errors above the form", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({ values: {}, fields: {}, error: "contact_unavailable" }));
    render(<ContactView config={footerConfig({ ...base, supportEmail: "aide@plazo.fr" })} action={action} />);
    await userEvent.click(screen.getByRole("button", { name: "Envoyer le message" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Le formulaire de contact n’est pas encore ouvert.");
  });
});
