import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PRO_TOPICS } from "@/lib/pro-topics";
import { ProTopicView } from "../ProTopicView";

describe("ProTopicView", () => {
  it("shows the topic with its breadcrumb, its questions open on the first one, and leads to the demo and the other topics", () => {
    const { container } = render(<ProTopicView topic={PRO_TOPICS.voiturier} homeHref="/loueurs" pricingHref="/loueurs/tarifs" demoHref="/pro/demo" />);
    expect(screen.getByRole("heading", { level: 1, name: "Chaque voiture rangée pour repartir" })).toBeInTheDocument();
    const crumbs = screen.getByRole("navigation", { name: "Fil d’Ariane" });
    expect(within(crumbs).getByRole("link", { name: "Plazo Pro" })).toHaveAttribute("href", "/loueurs");
    const details = container.querySelectorAll("details");
    expect(details).toHaveLength(PRO_TOPICS.voiturier.faq.length);
    expect(details[0]).toHaveAttribute("open");
    expect(details[1]).not.toHaveAttribute("open");
    expect(screen.getByRole("link", { name: /^Navette/ })).toHaveAttribute("href", "/loueurs/navette");
    expect(screen.getAllByRole("link", { name: "Essayer la démo" })[0]).toHaveAttribute("href", "/pro/demo");
    expect(document.body.textContent).not.toMatch(/GPS|SMS|suivi de vol|API/);
  });
});
