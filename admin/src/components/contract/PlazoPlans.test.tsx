import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { PlazoPlans } from "./PlazoPlans";

// 24/11/2026: the price agreed with Plazo replaces the grid's on « Mon contrat » for its plan.
describe("PlazoPlans", () => {
  it("montre le tarif convenu à la place de la grille, au mois et à l'année", async () => {
    render(
      <MemoryRouter>
        <PlazoPlans operatorName="APL Parking" agreed={{ plan: "operations", monthlyCents: 19900 }} />
      </MemoryRouter>,
    );
    const plans = screen.getByTestId("plazo-plans");
    expect(within(plans).getByTestId("price-operations")).toHaveTextContent("199 €");
    expect(screen.getByTestId("agreed-operations")).toHaveTextContent("Tarif convenu avec Plazo (grille 299 €)");
    expect(within(plans).getByTestId("price-complet")).toHaveTextContent("399 €");
    await userEvent.click(screen.getByTestId("plans-yearly"));
    expect(within(plans).getByTestId("price-operations")).toHaveTextContent("179,10 €");
  });
});
