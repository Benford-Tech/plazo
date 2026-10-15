import { render, screen } from "@testing-library/react";
import { Plate } from "./Plate";

describe("Plate", () => {
  it("montre la plaque", () => {
    render(<Plate value="AB-123-CD" />);
    expect(screen.getByText("AB-123-CD")).toBeInTheDocument();
    expect(screen.queryByLabelText("Plaque à saisir")).not.toBeInTheDocument();
  });

  it("15/10/2026 : « À saisir » pour une réservation importée sans plaque", () => {
    render(<Plate value="" size="sm" />);
    expect(screen.getByLabelText("Plaque à saisir")).toBeInTheDocument();
    expect(screen.getByText("À saisir")).toHaveClass("font-normal", "text-muted-foreground");
  });

  it("une réservation anonymisée garde son tiret", () => {
    render(<Plate value="—" />);
    expect(screen.getByText("—")).toHaveClass("font-bold");
  });
});
