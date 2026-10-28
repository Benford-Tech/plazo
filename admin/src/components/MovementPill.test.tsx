import { render, screen } from "@testing-library/react";
import { nextMovementOf } from "@/lib/movement";
import { MovementPill } from "./MovementPill";

describe("Arrivées · Départs (28/10/2026)", () => {
  it("le prochain mouvement suit le statut", () => {
    expect(nextMovementOf("upcoming")).toBe("arrival");
    expect(nextMovementOf("arrived")).toBe("departure");
    expect(nextMovementOf("back_at_parking")).toBe("departure");
    expect(nextMovementOf("returned")).toBeNull();
    expect(nextMovementOf("cancelled")).toBeNull();
  });

  it("la pastille dit son genre, avec l'heure", () => {
    render(
      <>
        <MovementPill kind="arrival" time="06:30" />
        <MovementPill kind="departure" />
      </>,
    );
    expect(screen.getByTestId("movement-arrival")).toHaveTextContent("Arrivée · 06:30");
    expect(screen.getByTestId("movement-arrival").className).toContain("bg-ok");
    expect(screen.getByTestId("movement-departure")).toHaveTextContent("Départ");
    expect(screen.getByTestId("movement-departure").className).toContain("bg-info");
  });
});
