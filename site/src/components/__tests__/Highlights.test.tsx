import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrustBand } from "../Highlights";
import { trustTiles } from "@/lib/highlights";

describe("« L’essentiel » of a parking page (14/10/2026)", () => {
  it("five tiles in full rows, the live shuttle with its breathing dot", () => {
    render(
      <TrustBand
        tiles={trustTiles({
          services: ["shuttle", "valet", "open_24h"],
          shuttleMinutes: 5,
          shuttleWaitMinutes: 5,
          liveShuttle: true,
          openingHours: null,
          cancellationPolicy: "free_24h",
        })}
      />,
    );
    const band = screen.getByRole("list", { name: "L’essentiel" });
    const tiles = screen.getAllByRole("listitem");
    expect(tiles.map(t => t.dataset.tile)).toEqual(["shuttle", "outdoor", "keys", "opening", "cancellation"]);
    expect(band).toHaveClass("grid-cols-2", "lg:grid-cols-6");
    // Three then two on a wide screen; on a phone the odd last tile takes the row.
    expect(tiles.slice(0, 3).every(t => t.classList.contains("lg:col-span-2"))).toBe(true);
    expect(tiles[4]).toHaveClass("col-span-2", "lg:col-span-3");
    expect(tiles[0]).toHaveTextContent("Navette en directGratuite · trajet 5 min · attente moyenne 5 min · suivez-la sur la carte le jour J");
    expect(tiles[0].querySelector(".live-dot")).not.toBeNull();
    expect(tiles[2]).toHaveTextContent("Vous devez remettre vos clésUn voiturier gare votre voiture");
    expect(tiles[3]).toHaveTextContent("Ouvert 24h/24Dépôt et retour à toute heure");
  });

  it("four tiles on one row, no dot for a shuttle that is not shown live", () => {
    render(<TrustBand tiles={trustTiles({ services: ["shuttle"], shuttleMinutes: 8, openingHours: null, cancellationPolicy: "free_48h" })} />);
    expect(screen.getByRole("list", { name: "L’essentiel" })).toHaveClass("lg:grid-cols-4");
    const tiles = screen.getAllByRole("listitem");
    expect(tiles.map(t => t.dataset.tile)).toEqual(["shuttle", "outdoor", "keys", "cancellation"]);
    expect(tiles[0]).toHaveTextContent("Navette gratuiteTrajet 8 min");
    expect(tiles[0].querySelector(".live-dot")).toBeNull();
  });
});
