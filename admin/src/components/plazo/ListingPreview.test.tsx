import { render, screen, within } from "@testing-library/react";
import { ListingPreview } from "./ListingPreview";

const base = {
  title: "Parking Démo LYS",
  services: ["shuttle"] as const,
  shuttleMinutes: 8,
  shuttleWaitMinutes: null,
  openingHours: "",
  cancellationPolicy: "free_24h" as const,
  fromPriceCents: 3499,
};
type Props = Parameters<typeof ListingPreview>[0];
const renderPreview = (over: Partial<Props> = {}) => render(<ListingPreview {...base} services={[...base.services]} {...over} />);

/** What a sighted traveller reads: the text without the screen-reader-only wording. */
function seen(el: HTMLElement) {
  const copy = el.cloneNode(true) as HTMLElement;
  copy.querySelectorAll(".sr-only").forEach(n => n.remove());
  return copy.textContent;
}
const tags = () => within(screen.getByRole("list", { name: "Tags de l'annonce" })).getAllByRole("listitem");

describe("ListingPreview: the tags of the Plazo results (14/10/2026)", () => {
  it("« Navette gratuite · trajet N min · attente moy. N min », a missing figure left out", () => {
    const { unmount } = renderPreview({ shuttleWaitMinutes: 5 });
    expect(seen(screen.getByTestId("preview-shuttle"))).toBe("Navette gratuite · trajet 8 min · attente moy. 5 min");
    // Screen readers hear the wait in full.
    expect(within(screen.getByTestId("preview-shuttle")).getByText("attente moyenne")).toHaveClass("sr-only");
    unmount();

    renderPreview({ shuttleMinutes: null, shuttleWaitMinutes: 0 });
    expect(seen(screen.getByTestId("preview-shuttle"))).toBe("Navette gratuite · attente moy. 0 min");
  });

  it("only « Navette gratuite » without figures, no shuttle line without the shuttle", () => {
    const { unmount } = renderPreview({ shuttleMinutes: null });
    expect(seen(screen.getByTestId("preview-shuttle"))).toBe("Navette gratuite");
    unmount();

    renderPreview({ services: ["valet"], shuttleWaitMinutes: 5 });
    expect(screen.queryByTestId("preview-shuttle")).not.toBeInTheDocument();
    expect(screen.queryByText(/attente/)).not.toBeInTheDocument();
  });

  it("the chips in the site's order, with the longer wording for assistive technology", () => {
    renderPreview({ services: ["shuttle", "valet", "covered", "fenced", "ev_charging", "cctv"], openingHours: "6h–23h", cancellationPolicy: "free_until_arrival" });
    expect(tags().map(seen)).toEqual(["Couvert", "Vous devez remettre vos clés", "Ouvert 6h–23h", "Clôturé", "Recharge", "Gratuit jusqu’à l’arrivée"]);
    const ev = tags()[4];
    expect(ev).toHaveAttribute("title", "Recharge électrique");
    expect(ev).toHaveTextContent("Recharge (Recharge électrique)");
    // Vidéosurveillance is not a tag of the results (it is on the parking page).
    expect(screen.queryByText(/Vidéosurveillance/)).not.toBeInTheDocument();
  });

  it("a non-refundable parking: the warning chip in the amber tint", () => {
    renderPreview({ services: [], openingHours: "24h/24", cancellationPolicy: "non_refundable" });
    expect(tags().map(seen)).toEqual(["Extérieur", "Vous gardez vos clés", "Ouvert 24h/24", "Non remboursable"]);
    const warning = tags().at(-1)!;
    expect(warning).toHaveClass("bg-warn-soft");
    expect(warning).toHaveAttribute("title", "Non annulable");
    expect(tags()[0]).not.toHaveClass("bg-warn-soft");
  });

  it("keeps the price and the « Nouveau sur » line", () => {
    renderPreview({ fromPriceCents: null });
    expect(screen.getByText("prix à définir")).toBeInTheDocument();
    expect(screen.getByText("Nouveau sur Plazo")).toBeInTheDocument();
  });
});
