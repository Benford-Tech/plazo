import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BlogArticle, BlogWeek } from "@/lib/types";
import ArticlesPage from "./ArticlesPage";

const api = vi.hoisted(() => ({ getBlogWeek: vi.fn(), blogArticleAction: vi.fn(), updateBlogArticle: vi.fn(), rewriteBlogArticle: vi.fn(), writeBlogDay: vi.fn() }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const article = (over: Partial<BlogArticle> = {}): BlogArticle => ({
  id: "a1",
  dueOn: "2026-11-27",
  status: "draft",
  topic: "Vacances de février",
  query: "parking aéroport lyon vacances février",
  slug: "parking-lyon-vacances-fevrier",
  title: "Parking à l'aéroport de Lyon pendant les vacances de février",
  metaTitle: "Parking aéroport Lyon en février",
  metaDescription: "Quand réserver votre parking à Lyon Saint-Exupéry.",
  intro: "Les parkings se remplissent vite.",
  body: "## Combien compter ?\n\nPour 8 jours, dès 62,00 €.\n\n- Comparez\n- Réservez",
  related: ["parking-longue-duree"],
  sources: ["lyonaeroports.com"],
  warnings: ["Chiffres absents des faits, à vérifier : 7."],
  wordCount: 1240,
  model: null,
  error: null,
  writtenAt: "2026-11-26T20:10:00Z",
  publishedAt: null,
  rejectedAt: null,
  clicks: null,
  ...over,
});

const week = (): BlogWeek => ({
  today: "2026-11-26",
  monday: "2026-11-23",
  configured: true,
  counts: { published: 18, toReview: 1, clicks: 214 },
  days: [
    { day: "2026-11-23", article: null },
    { day: "2026-11-24", article: article({ id: "a0", dueOn: "2026-11-24", status: "published", title: "Depuis Valence", clicks: 31 }) },
    { day: "2026-11-25", article: null },
    { day: "2026-11-26", article: null },
    { day: "2026-11-27", article: article() },
    { day: "2026-11-28", article: article({ id: "a2", dueOn: "2026-11-28", status: "planned", topic: "Départ au ski", body: null, title: null }) },
    { day: "2026-11-29", article: null },
  ],
});

function show(path = "/plateforme/articles") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <ArticlesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Plateforme › Articles (26/11/2026)", () => {
  beforeEach(() => {
    Object.values(api).forEach((f) => f.mockReset());
    api.getBlogWeek.mockResolvedValue(week());
    api.blogArticleAction.mockResolvedValue({ data: article({ status: "published" }) });
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("montre la semaine : publiés, à valider, sujets prévus et clics", async () => {
    show();
    const grid = await screen.findByTestId("blog-week");
    expect(screen.getByTestId("blog-counts")).toHaveTextContent("214");
    expect(within(grid).getByTestId("blog-day-2026-11-24")).toHaveTextContent("Publié");
    expect(within(grid).getByTestId("blog-day-2026-11-24")).toHaveTextContent("31 clics");
    expect(within(grid).getByTestId("blog-day-2026-11-27")).toHaveTextContent("À valider");
    expect(within(grid).getByTestId("blog-day-2026-11-28")).toHaveTextContent("Sujet prévu : Départ au ski");
    expect(within(grid).getByTestId("blog-write-2026-11-28")).toBeInTheDocument();
    expect(within(grid).queryByTestId("blog-write-2026-11-27")).toBeNull();
  });

  it("ouvre l'article dans le tiroir : points à vérifier, aperçu Google, puis Publier", async () => {
    show();
    await userEvent.click(await screen.findByTestId("blog-open-2026-11-27"));
    const drawer = await screen.findByTestId("blog-drawer");
    expect(within(drawer).getByTestId("blog-checks")).toHaveTextContent("à vérifier : 7");
    expect(within(drawer).getByTestId("blog-serp")).toHaveTextContent("www.plazo.fr › blog › parking-lyon-vacances-fevrier");
    expect(within(drawer).getByTestId("blog-body").querySelectorAll("li")).toHaveLength(2);
    await userEvent.click(within(drawer).getByTestId("blog-publish"));
    expect(api.blogArticleAction).toHaveBeenCalledWith("a1", "publish");
  });

  it("modifie le texte et réécrit avec une consigne", async () => {
    api.updateBlogArticle.mockResolvedValue({ data: article() });
    api.rewriteBlogArticle.mockResolvedValue({ data: article() });
    show("/plateforme/articles?article=a1");
    const drawer = await screen.findByTestId("blog-drawer");
    await userEvent.click(within(drawer).getByTestId("blog-edit"));
    const title = within(drawer).getByTestId("blog-field-title");
    await userEvent.clear(title);
    await userEvent.type(title, "Nouveau titre");
    await userEvent.click(within(drawer).getByTestId("blog-save"));
    expect(api.updateBlogArticle).toHaveBeenCalledWith("a1", expect.objectContaining({ title: "Nouveau titre" }));

    await userEvent.click(within(drawer).getByTestId("blog-rewrite"));
    await userEvent.type(within(drawer).getByTestId("blog-instruction"), "Plus court");
    await userEvent.click(within(drawer).getByTestId("blog-rewrite-go"));
    expect(api.rewriteBlogArticle).toHaveBeenCalledWith("a1", "Plus court");
  });
});
