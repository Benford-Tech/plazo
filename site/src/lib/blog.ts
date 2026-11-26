// 26/11/2026 (« Un par jour, je valide chaque article », B): the blog's articles, written by Claude and published by a
// platform admin. French only, like the guides.
import { GUIDE_TOPICS, topicPath, type GuideTopicSlug } from "./guides/topics";

export const BLOG_PATH = "/blog";
export const BLOG_AIRPORT = "lyon-saint-exupery";

export interface BlogSummary {
  slug: string;
  title: string;
  metaTitle: string | null;
  metaDescription: string | null;
  intro: string | null;
  publishedAt: string;
  updatedAt: string;
  wordCount: number;
}

export interface BlogArticle extends BlogSummary {
  body: string;
  related: string[];
  sources: string[];
  others: BlogSummary[];
}

export type BlogBlock = { kind: "h2"; text: string } | { kind: "list"; items: string[] } | { kind: "p"; text: string };

/** The body as written by the API: blank lines between blocks, « ## » headings, « - » list items. */
export function blogBlocks(body: string): BlogBlock[] {
  return body
    .split(/\n{2,}/)
    .map(b => b.trim())
    .filter(Boolean)
    .map((block): BlogBlock => {
      if (block.startsWith("## ")) return { kind: "h2", text: block.slice(3).trim() };
      const lines = block.split("\n").map(l => l.trim());
      if (lines.every(l => l.startsWith("- "))) return { kind: "list", items: lines.map(l => l.slice(2).trim()) };
      return { kind: "p", text: lines.join(" ") };
    });
}

export const blogPath = (slug: string) => `${BLOG_PATH}/${slug}`;

/** The guides an article points to, known ones only. */
export function relatedGuides(slugs: string[]): { href: string; short: string }[] {
  return slugs
    .map(s => GUIDE_TOPICS.find(t => t.slug === s))
    .filter((t): t is (typeof GUIDE_TOPICS)[number] => !!t)
    .map(t => ({ href: topicPath(BLOG_AIRPORT, t.slug as GuideTopicSlug), short: t.short }));
}

/** « 26 novembre 2026 » from an instant, in Paris. */
export function blogDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(new Date(iso));
}

export const isoDay = (iso: string) => new Date(iso).toISOString().slice(0, 10);
