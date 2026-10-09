import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BookingForm } from "../BookingForm";
import type { FormState } from "@/lib/forms";

const stay = { airport: "lyon-saint-exupery", parking: "parking-demo-lys", arrivalAt: "2026-10-04T06:30", returnAt: "2026-10-11T15:05" };
const links = { results: "/lyon-saint-exupery/recherche?arrivee=x", parking: "/lyon-saint-exupery/parking-demo-lys?arrivee=x" };

const KEY = "6f1c2a9e-3b7d-4e8f-9a0b-1c2d3e4f5a6b";

function renderForm(action: (state: FormState, formData: FormData) => Promise<FormState>) {
  return render(<BookingForm action={action} stay={stay} total="55,00 €" links={links} idempotencyKey={KEY} />);
}

describe("BookingForm", () => {
  it("sends the typed fields and the stay, never a price", async () => {
    const action = vi.fn(async (_state: FormState, _formData: FormData): Promise<FormState> => ({ values: {}, fields: {}, error: null }));
    renderForm(action);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Prénom"), "Camille");
    await user.type(screen.getByLabelText("Nom"), "Laurent");
    await user.type(screen.getByLabelText(/Téléphone mobile/), "06 12 34 56 78");
    await user.type(screen.getByLabelText(/Email/), "camille@example.com");
    await user.type(screen.getByLabelText("Plaque d’immatriculation"), "gk318px");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Continuer vers le paiement" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const data = action.mock.calls[0][1];
    expect(Object.fromEntries(data.entries())).toMatchObject({
      ...stay,
      customerFirstName: "Camille",
      customerLastName: "Laurent",
      customerPhone: "06 12 34 56 78",
      customerEmail: "camille@example.com",
      plate: "GK-318-PX",
      passengers: "1",
      acceptTerms: "on",
      // Same key on every submission of this page: a retry cannot book twice.
      idempotencyKey: KEY,
    });
    expect([...data.keys()].some(k => /price|prix|total/i.test(k))).toBe(false);
  });

  it("shows the API's field errors in French, under each field", async () => {
    const action = vi.fn(
      async (): Promise<FormState> => ({
        values: { customerFirstName: "Camille", customerLastName: "L4urent", customerEmail: "pas-un-email", plate: "??" },
        fields: {
          customerLastName: "invalid_name",
          customerEmail: "invalid_email",
          plate: "invalid_plate",
          acceptTerms: "terms_required",
          customerPhone: "required",
        },
        error: "validation_failed",
      }),
    );
    renderForm(action);
    await userEvent.setup().click(screen.getByRole("button", { name: "Continuer vers le paiement" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Certains champs sont à corriger.");
    expect(screen.getByLabelText(/Email/)).toHaveAccessibleDescription("Adresse email invalide.");
    expect(screen.getByLabelText(/Email/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Plaque d’immatriculation")).toHaveAccessibleDescription("Plaque invalide.");
    expect(screen.getByLabelText(/Téléphone mobile/)).toHaveAccessibleDescription("Champ obligatoire.");
    // One message per name field.
    expect(screen.getByLabelText("Nom")).toHaveAccessibleDescription("Lettres, espaces, apostrophes et tirets seulement.");
    expect(screen.getByLabelText("Nom")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Prénom")).not.toHaveAttribute("aria-invalid");
    expect(screen.getByText("Merci d’accepter les conditions pour réserver.")).toBeInTheDocument();
    // The typed values come back (React resets uncontrolled fields after an action).
    expect(screen.getByLabelText("Prénom")).toHaveValue("Camille");
    expect(screen.getByLabelText("Nom")).toHaveValue("L4urent");
  });

  it("shows an error reported on the full name (`customerName`) under « Prénom », never lost", async () => {
    const action = vi.fn(
      async (): Promise<FormState> => ({ values: {}, fields: { customerName: "required" }, error: "validation_failed" }),
    );
    renderForm(action);
    await userEvent.setup().click(screen.getByRole("button", { name: "Continuer vers le paiement" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Certains champs sont à corriger.");
    expect(screen.getByLabelText("Prénom")).toHaveAccessibleDescription("Champ obligatoire.");
    expect(screen.getByLabelText("Prénom")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Nom")).not.toHaveAttribute("aria-invalid");
  });

  it("asks for the first name and the last name apart, as the browser fills them", () => {
    renderForm(vi.fn());
    const first = screen.getByLabelText("Prénom");
    const last = screen.getByLabelText("Nom");
    expect(first).toHaveAttribute("autocomplete", "given-name");
    expect(last).toHaveAttribute("autocomplete", "family-name");
    for (const input of [first, last]) {
      expect(input).toBeRequired();
      expect(input).toHaveAttribute("maxlength", "60");
    }
    expect(screen.queryByLabelText("Prénom et nom")).not.toBeInTheDocument();
  });

  it("explains an overbooking with the full nights and a way out", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({ values: {}, fields: {}, error: "overbooked", fullNights: ["2026-10-04", "2026-10-05"] }));
    renderForm(action);
    await userEvent.setup().click(screen.getByRole("button", { name: "Continuer vers le paiement" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Ce parking n’est plus disponible pour vos dates");
    expect(alert).toHaveTextContent("Nuits complètes : dim. 4 oct., lun. 5 oct.");
    expect(alert).not.toHaveTextContent("oct..");
    expect(screen.getByRole("link", { name: "Voir les autres parkings" })).toHaveAttribute("href", links.results);
  });

  it("paid online: step 1 of 2, « Continuer vers le paiement », no « paid at the parking » section", () => {
    const action = vi.fn(async (): Promise<FormState> => ({ values: {}, fields: {}, error: null }));
    render(<BookingForm action={action} stay={stay} total="55,00 €" links={links} idempotencyKey={KEY} online />);
    expect(screen.getByRole("button", { name: "Continuer vers le paiement" })).toBeInTheDocument();
    expect(screen.queryByText("Paiement sur place")).not.toBeInTheDocument();
    expect(screen.getByText("Paiement sécurisé par carte à l’étape suivante : 55,00 €.")).toBeInTheDocument();
  });

  it("refilled with what the traveller typed when coming back from the payment step", () => {
    const action = vi.fn(async (): Promise<FormState> => ({ values: {}, fields: {}, error: null }));
    const initialState = {
      values: { customerFirstName: "Camille", customerLastName: "Martin", plate: "AB-123-CD", passengers: "3", acceptTerms: "on" },
      fields: {},
      error: null,
    };
    render(<BookingForm action={action} stay={stay} total="55,00 €" links={links} online initialState={initialState} />);
    expect(screen.getByLabelText("Prénom")).toHaveValue("Camille");
    expect(screen.getByLabelText("Nom")).toHaveValue("Martin");
    expect(screen.getByLabelText("Passagers")).toHaveValue("3");
    expect(screen.getByRole("checkbox")).toBeChecked();
  });
});
