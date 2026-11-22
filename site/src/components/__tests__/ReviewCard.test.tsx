import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReviewCard } from "../ReviewCard";

describe("ReviewCard (lien d'avis Google, 22/11/2026)", () => {
  it("asks for a review of the parking and opens Google's page in a new tab", () => {
    render(<ReviewCard parking="Parking des Cèdres" url="https://g.page/r/CbX/review" />);
    expect(screen.getByRole("heading", { name: "Bon retour !" })).toBeInTheDocument();
    expect(screen.getByText(/Un mot sur Parking des Cèdres \?/)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Laisser un avis Google" });
    expect(link).toHaveAttribute("href", "https://g.page/r/CbX/review");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
