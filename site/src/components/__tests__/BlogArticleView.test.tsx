import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { asideFacts, BlogArticleView } from "../blog/BlogArticleView";
import type { BlogArticle } from "@/lib/blog";
import type { SearchResponse } from "@/lib/types";

const article: BlogArticle = {
  slug: "vacances-fevrier",
  title: "Parking à l'aéroport de Lyon pendant les vacances de février",
  metaTitle: null,
  metaDescription: "Quand réserver.",
  intro: "Les parkings se remplissent vite.",
  publishedAt: "2026-11-27T07:00:00.000Z",
  updatedAt: "2026-11-27T07:00:00.000Z",
  wordCount: 1200,
  body: "## Combien compter ?\n\nPour 8 jours, dès 62,00 €.\n\n- Comparez\n- Réservez",
  related: ["parking-longue-duree"],
  sources: ["lyonaeroports.com"],
  others: [{ slug: "vol-annule", title: "Vol annulé", metaTitle: null, metaDescription: null, intro: null, publishedAt: "2026-11-26T07:00:00.000Z", updatedAt: "2026-11-26T07:00:00.000Z", wordCount: 900 }],
};

describe("BlogArticleView (26/11/2026)", () => {
  it("shows the article, its facts, the search and the guides it points to", () => {
    render(<BlogArticleView article={article} facts={{ days: 8, fromCents: 6200, shuttleMinutes: 8, partners: 3 }} stay={{ arrivee: "2026-12-01T08:00", retour: "2026-12-08T18:00" }} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(article.title);
    expect(within(screen.getByTestId("blog-body")).getByRole("heading", { level: 2 })).toHaveTextContent("Combien compter ?");
    expect(screen.getByText("62,00 €")).toBeInTheDocument();
    expect(screen.getByTestId("blog-cta").getAttribute("href")).toContain("/lyon-saint-exupery/recherche");
    expect(screen.getByRole("link", { name: /Parking longue durée/ }).getAttribute("href")).toBe("/lyon-saint-exupery/guide/parking-longue-duree");
    expect(screen.getByRole("link", { name: /Vol annulé/ }).getAttribute("href")).toBe("/blog/vol-annule");
  });

  it("counts the real partners only", () => {
    const preview = {
      results: [
        { isDemo: true, available: true, priceCents: 1000, days: 8, shuttleMinutes: 3 },
        { isDemo: false, available: true, priceCents: 6200, days: 8, shuttleMinutes: 8 },
        { isDemo: false, available: false, priceCents: null, days: 8, shuttleMinutes: 5 },
      ],
    } as unknown as SearchResponse;
    expect(asideFacts(preview)).toEqual({ days: 8, fromCents: 6200, shuttleMinutes: 8, partners: 1 });
    expect(asideFacts(null)).toBeNull();
  });
});
