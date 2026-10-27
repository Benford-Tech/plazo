import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EMPTY_FORM } from "@/lib/forms";
import { ProHome } from "../ProHome";

describe("ProHome", () => {
  it("opens on the hero, lists the four products and the plans, and leads to the demo and the prices", () => {
    render(<ProHome action={vi.fn(async () => EMPTY_FORM)} demoHref="/pro/demo" pricingHref="/loueurs/tarifs" />);
    expect(screen.getByRole("heading", { level: 1, name: "Le logiciel des parkings d’aéroport" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Construire mon offre" })).toHaveAttribute("href", "/loueurs/tarifs");
    expect(screen.getAllByRole("link", { name: "Essayer la démo" })[0]).toHaveAttribute("href", "/pro/demo");
    for (const id of ["logiciel", "application", "vendre-sur-plazo", "contrat"]) expect(document.getElementById(id)).not.toBeNull();
    const prices = screen.getByRole("region", { name: "Construisez votre offre" });
    expect(within(prices).getByText(/^149\s€$/)).toBeInTheDocument();
    expect(within(prices).getByRole("link", { name: "Voir tous les tarifs" })).toHaveAttribute("href", "/loueurs/tarifs");
  });

  it("sends a demo request without a selection", async () => {
    const action = vi.fn(async (_state: unknown, form: FormData) => {
      expect(form.get("request")).toBe("demo");
      expect(form.get("plan")).toBeNull();
      return { ...EMPTY_FORM, notice: "quote_sent" };
    });
    render(<ProHome action={action} demoHref="/pro/demo" pricingHref="/loueurs/tarifs" />);
    const form = screen.getByRole("region", { name: "Un renseignement ?" });
    await userEvent.type(within(form).getByLabelText("Prénom"), "Camille");
    await userEvent.type(within(form).getByLabelText("Nom"), "Martin");
    await userEvent.type(within(form).getByLabelText("Parking"), "Parking des Cèdres");
    await userEvent.type(within(form).getByLabelText("E-mail"), "camille@parking.fr");
    await userEvent.click(within(form).getByRole("button", { name: "Demander une démo" }));
    expect(action).toHaveBeenCalled();
    expect(await screen.findByText(/nous vous écrivons très vite pour vous montrer Plazo/)).toBeInTheDocument();
  });
});
