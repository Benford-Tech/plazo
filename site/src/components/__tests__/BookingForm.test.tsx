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
    await user.type(screen.getByLabelText("Prénom et nom"), "Camille Laurent");
    await user.type(screen.getByLabelText(/Téléphone mobile/), "06 12 34 56 78");
    await user.type(screen.getByLabelText(/Email/), "camille@example.com");
    await user.type(screen.getByLabelText("Plaque d’immatriculation"), "gk318px");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Confirmer la réservation" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const data = action.mock.calls[0][1];
    expect(Object.fromEntries(data.entries())).toMatchObject({
      ...stay,
      customerName: "Camille Laurent",
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
        values: { customerName: "Camille", customerEmail: "pas-un-email", plate: "??" },
        fields: { customerEmail: "invalid_email", plate: "invalid_plate", acceptTerms: "terms_required", customerPhone: "required" },
        error: "validation_failed",
      }),
    );
    renderForm(action);
    await userEvent.setup().click(screen.getByRole("button", { name: "Confirmer la réservation" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Certains champs sont à corriger.");
    expect(screen.getByLabelText(/Email/)).toHaveAccessibleDescription("Adresse email invalide.");
    expect(screen.getByLabelText(/Email/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Plaque d’immatriculation")).toHaveAccessibleDescription("Plaque invalide.");
    expect(screen.getByLabelText(/Téléphone mobile/)).toHaveAccessibleDescription("Champ obligatoire.");
    expect(screen.getByText("Merci d’accepter les conditions pour réserver.")).toBeInTheDocument();
    // The typed values come back (React resets uncontrolled fields after an action).
    expect(screen.getByLabelText("Prénom et nom")).toHaveValue("Camille");
  });

  it("explains an overbooking with the full nights and a way out", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({ values: {}, fields: {}, error: "overbooked", fullNights: ["2026-10-04", "2026-10-05"] }));
    renderForm(action);
    await userEvent.setup().click(screen.getByRole("button", { name: "Confirmer la réservation" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Ce parking n’est plus disponible pour vos dates");
    expect(alert).toHaveTextContent("Nuits complètes : dim. 4 oct., lun. 5 oct.");
    expect(alert).not.toHaveTextContent("oct..");
    expect(screen.getByRole("link", { name: "Voir les autres parkings" })).toHaveAttribute("href", links.results);
  });

  it("says that payment happens at the parking", () => {
    renderForm(vi.fn());
    expect(screen.getByText(/Vous ne payez rien en ligne : vous réglez 55,00 € directement à l’accueil du parking/)).toBeInTheDocument();
    expect(screen.queryByText(/carte bancaire n’est demandée/)).toBeInTheDocument();
  });
});
