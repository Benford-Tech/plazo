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

  it("child seats: off by default, three steppers once on, the counts sent with the form", async () => {
    const action = vi.fn(async (_state: FormState, _formData: FormData): Promise<FormState> => ({ values: {}, fields: {}, error: null }));
    renderForm(action);
    const user = userEvent.setup();
    const toggle = screen.getByRole("switch", { name: "Des enfants à bord ?" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(screen.queryByRole("button", { name: "Un bébé de plus" })).not.toBeInTheDocument();
    expect(screen.getByText("Les enfants comptent dans les passagers. Sièges prêtés à l’aller comme au retour, gratuit.")).toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("Bébé · jusqu’à 12 mois")).toBeInTheDocument();
    expect(screen.getByText("Siège dos à la route")).toBeInTheDocument();
    expect(screen.getByText("1 à 4 ans")).toBeInTheDocument();
    expect(screen.getByText("4 à 10 ans")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Un bébé de moins" })).toBeDisabled();

    await user.selectOptions(screen.getByLabelText("Passagers"), "3");
    await user.click(screen.getByRole("button", { name: "Un bébé de plus" }));
    await user.click(screen.getByRole("button", { name: "Un enfant de 4 à 10 ans de plus" }));
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Continuer vers le paiement" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(Object.fromEntries(action.mock.calls[0][1].entries())).toMatchObject({ passengers: "3", childSeatsInfant: "1", childSeatsToddler: "0", childSeatsBooster: "1" });
  });

  it("child seats: no more seats than passengers, said on the spot and the form held back", async () => {
    const action = vi.fn(async (_state: FormState, _formData: FormData): Promise<FormState> => ({ values: {}, fields: {}, error: null }));
    renderForm(action);
    const user = userEvent.setup();
    await user.click(screen.getByRole("switch", { name: "Des enfants à bord ?" }));
    await user.click(screen.getByRole("button", { name: "Un bébé de plus" }));
    expect(screen.getByText("Les enfants comptent dans les passagers : ajoutez-les au nombre de passagers.")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Continuer vers le paiement" }));
    expect(action).not.toHaveBeenCalled();
    // More passengers: the rule holds again, the hint comes back.
    await user.selectOptions(screen.getByLabelText("Passagers"), "2");
    expect(screen.queryByText("Les enfants comptent dans les passagers : ajoutez-les au nombre de passagers.")).not.toBeInTheDocument();
    // Switched off: nothing is sent, whatever the counts were.
    await user.click(screen.getByRole("switch", { name: "Des enfants à bord ?" }));
    await user.click(screen.getByRole("button", { name: "Continuer vers le paiement" }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect([...action.mock.calls[0][1].keys()].some(k => k.startsWith("childSeats"))).toBe(false);
  });

  it("child seats: refilled and open when the booking asked for some, the API's refusal under the block", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({ values: { passengers: "1", childSeatsInfant: "1" }, fields: {}, error: "child_seats_exceed_passengers" }));
    const initialState = { values: { passengers: "3", childSeatsInfant: "1", childSeatsToddler: "0", childSeatsBooster: "1", acceptTerms: "on" }, fields: {}, error: null };
    render(<BookingForm action={action} stay={stay} total="55,00 €" links={links} online initialState={initialState} />);
    expect(screen.getByRole("switch", { name: "Des enfants à bord ?" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("button", { name: "Un bébé de moins" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Un enfant de 4 à 10 ans de moins" })).toBeEnabled();
    await userEvent.setup().click(screen.getByRole("button", { name: "Continuer vers le paiement" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Les enfants comptent dans les passagers : ajoutez-les au nombre de passagers.");
    expect(screen.getByRole("switch", { name: "Des enfants à bord ?" })).toHaveAccessibleDescription("Les enfants comptent dans les passagers : ajoutez-les au nombre de passagers.");
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
