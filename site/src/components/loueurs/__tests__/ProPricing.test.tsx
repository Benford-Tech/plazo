import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EMPTY_FORM } from "@/lib/forms";
import { ProPricing } from "../ProPricing";

const action = vi.fn(async () => EMPTY_FORM);

function renderPage() {
  render(<ProPricing action={action} demoHref="/pro/demo" signupHref="/pro/inscription" supportEmail="contact@plazo.fr" />);
}

function recap() {
  return screen.getAllByRole("complementary", { name: "Votre sélection" })[0];
}

describe("ProPricing", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("opens on the recommended plan with the listing on Plazo, and totals the month", () => {
    renderPage();
    expect(screen.getByRole("radio", { name: /^★\s*Recommandé\s*Opérations/ })).toHaveAttribute("aria-checked", "true");
    expect(within(recap()).getByText("Logiciel Opérations")).toBeInTheDocument();
    expect(within(recap()).getByText("15 % par réservation")).toBeInTheDocument();
    expect(within(recap()).getByText(/^149\s€$/)).toBeInTheDocument();
  });

  it("changes plan, adds an option and bills yearly", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("radio", { name: /^Complet/ }));
    await userEvent.click(screen.getByLabelText(/Page de réservation à votre nom/));
    await userEvent.click(screen.getByRole("button", { name: /Annuel/ }));
    expect(within(recap()).getByText("Total annuel HT")).toBeInTheDocument();
    // (206,10 + 26,10) × 12
    expect(within(recap()).getByText(/^2\s786,40\s€$/)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("plazo:pro-pricing")!)).toMatchObject({ plan: "complet", yearly: true, options: ["booking_page"] });
  });

  it("does not offer an option that is not available yet", () => {
    renderPage();
    expect(screen.getByLabelText(/Deuxième parking/)).toBeDisabled();
  });

  it("links the demo and the sign-up of the pro space", () => {
    renderPage();
    expect(screen.getAllByRole("link", { name: "Essayer la démo" })[0]).toHaveAttribute("href", "/pro/demo");
    expect(screen.getByRole("link", { name: "Inscrire mon parking" })).toHaveAttribute("href", "/pro/inscription");
  });
});
