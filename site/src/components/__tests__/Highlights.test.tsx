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
    // Three then two on a wide screen; on a phone the shuttle across the band, then two rows of two (R3).
    expect(tiles.slice(0, 3).every(t => t.classList.contains("lg:col-span-2"))).toBe(true);
    expect(tiles.slice(3).every(t => t.classList.contains("lg:col-span-3"))).toBe(true);
    expect(tiles.map(t => t.classList.contains("col-span-2"))).toEqual([true, false, false, false, false]);
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
    // On a phone (R3): the shuttle across the band, a pair, then the odd last tile across the band; one each on a wide screen.
    expect(tiles.map(t => t.classList.contains("col-span-2"))).toEqual([true, false, false, true]);
    expect(tiles[0]).toHaveClass("lg:col-span-1");
    expect(tiles[3]).toHaveClass("lg:col-span-1");
  });

  it("on a phone, a shuttle and two tiles: the shuttle row, then one pair (R3)", () => {
    const tiles = trustTiles({ services: ["shuttle"], shuttleMinutes: 8, openingHours: null, cancellationPolicy: "free_until_arrival" }).slice(0, 3);
    render(<TrustBand tiles={tiles} />);
    const items = screen.getAllByRole("listitem");
    expect(items.map(t => t.dataset.tile)).toEqual(["shuttle", "outdoor", "keys"]);
    expect(items.map(t => t.classList.contains("col-span-2"))).toEqual([true, false, false]);
  });

  it("without a shuttle, the tiles two by two and an odd last one across the band, as before", () => {
    render(<TrustBand tiles={trustTiles({ services: ["valet", "open_24h"], shuttleMinutes: null, openingHours: null, cancellationPolicy: "non_refundable" })} />);
    const tiles = screen.getAllByRole("listitem");
    expect(tiles.map(t => t.dataset.tile)).toEqual(["outdoor", "keys", "opening", "cancellation"]);
    expect(tiles.map(t => t.classList.contains("col-span-2"))).toEqual([false, false, false, false]);
    render(<TrustBand tiles={trustTiles({ services: ["valet"], shuttleMinutes: null, openingHours: null, cancellationPolicy: "non_refundable" })} />);
    const three = [...screen.getAllByRole("list", { name: "L’essentiel" })[1].querySelectorAll("li")];
    expect(three.map(t => t.dataset.tile)).toEqual(["outdoor", "keys", "cancellation"]);
    expect(three.map(t => t.classList.contains("col-span-2"))).toEqual([false, false, true]);
    expect(three[2]).toHaveClass("lg:col-span-1");
  });

  it("a bare shuttle tile says « Vers le Terminal 1 » at Lyon, « Vers l’aéroport » elsewhere (R4)", () => {
    const bare = { services: ["shuttle"], shuttleMinutes: null, openingHours: null, cancellationPolicy: "free_48h" as const };
    render(<TrustBand tiles={trustTiles(bare, "LYS")} />);
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("Navette gratuiteVers le Terminal 1");
    render(<TrustBand tiles={trustTiles(bare, "BOD")} />);
    expect(screen.getAllByRole("list", { name: "L’essentiel" })[1].querySelector("li")).toHaveTextContent("Navette gratuiteVers l’aéroport");
    expect(screen.queryByText(/vers les terminaux/i)).toBeNull();
  });
});
