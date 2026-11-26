import Link from "@/components/Link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { JsonLd } from "@/components/JsonLd";
import { ChevronIcon } from "@/components/stay/pill";
import { BLOG_AIRPORT, BLOG_PATH, blogBlocks, blogDate, blogPath, isoDay, relatedGuides, type BlogArticle } from "@/lib/blog";
import { stayQuery } from "@/lib/dates";
import { formatEuros } from "@/lib/money";
import { siteUrl } from "@/lib/site";
import { articleLd, breadcrumbLd } from "@/lib/structured-data";
import type { SearchResponse } from "@/lib/types";

/** What the aside shows: the real partners' cheapest stay, the shortest shuttle, how many there are. */
export interface BlogAsideFacts {
  days: number;
  fromCents: number | null;
  shuttleMinutes: number | null;
  partners: number;
}

/** The real partners for the default stay (the search page's own numbers); null when the search does not answer. */
export function asideFacts(preview: SearchResponse | null): BlogAsideFacts | null {
  if (!preview) return null;
  const real = preview.results.filter(r => !r.isDemo && r.available && r.priceCents !== null);
  const minutes = real.map(r => r.shuttleMinutes).filter((n): n is number => typeof n === "number" && n > 0);
  return {
    days: real[0]?.days ?? 8,
    fromCents: real.length ? Math.min(...real.map(r => r.priceCents!)) : null,
    shuttleMinutes: minutes.length ? Math.min(...minutes) : null,
    partners: real.length,
  };
}

const MEASURE = "max-w-[65ch]";

/**
 * 26/11/2026 (B, https://claude.ai/artifact/XpLKzf3Ur3MftvFbHmExzH): a blog article in the Boutique style, its facts and
 * the search beside it, the guides it points to and the latest articles under it.
 */
export function BlogArticleView({ article, facts, stay }: { article: BlogArticle; facts: BlogAsideFacts | null; stay: { arrivee: string; retour: string } }) {
  const base = siteUrl();
  const path = blogPath(article.slug);
  const guides = relatedGuides(article.related);
  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-10 px-4 pt-4 pb-12 md:px-12 md:pt-[26px] md:pb-16">
      <JsonLd
        data={[
          breadcrumbLd(base, [
            { name: "Blog", path: BLOG_PATH },
            { name: article.title, path },
          ]),
          articleLd(base, {
            title: article.title,
            description: article.metaDescription ?? article.intro ?? "",
            path,
            published: isoDay(article.publishedAt),
            updated: isoDay(article.updatedAt),
          }),
        ]}
      />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-14">
        <article className="flex min-w-0 flex-col gap-5">
          <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Blog", href: BLOG_PATH }, { label: article.title }]} />
          <p className="eyebrow text-accent-dark">Conseils · {blogDate(article.publishedAt)}</p>
          <h1 className="font-title max-w-[19em] lining-nums text-[30px] leading-[1.12] text-ink md:text-[44px] md:leading-[1.08]">{article.title}</h1>
          {article.intro && <p className={`${MEASURE} border-t border-line pt-5 text-[17px] leading-[1.65] md:text-[18.5px]`}>{article.intro}</p>}
          <div className={`${MEASURE} flex flex-col gap-4 text-[16px] leading-[1.7]`} data-testid="blog-body">
            {blogBlocks(article.body).map((block, i) =>
              block.kind === "h2" ? (
                <h2 key={i} className="font-title mt-4 lining-nums text-[24px] leading-[1.2] text-ink md:text-[28px]">
                  {block.text}
                </h2>
              ) : block.kind === "list" ? (
                <ul key={i} className="ml-5 flex list-disc flex-col gap-1.5">
                  {block.items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p key={i}>{block.text}</p>
              ),
            )}
          </div>
          {article.sources.length > 0 && (
            <p className={`${MEASURE} border-t border-line pt-4 text-[13.5px] leading-[1.55] text-soft`}>Sources : {article.sources.join(", ")}.</p>
          )}
        </article>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <div className="card flex flex-col gap-3 p-5">
            {facts && facts.partners > 0 && (
              <dl className="flex flex-col gap-2 text-[14px]">
                {facts.fromCents !== null && (
                  <div className="flex justify-between gap-3 border-b border-line-soft pb-2">
                    <dt className="text-soft">{facts.days} jours dès</dt>
                    <dd className="font-bold text-ink">{formatEuros(facts.fromCents)}</dd>
                  </div>
                )}
                {facts.shuttleMinutes !== null && (
                  <div className="flex justify-between gap-3 border-b border-line-soft pb-2">
                    <dt className="text-soft">Navette</dt>
                    <dd className="font-bold text-ink">{facts.shuttleMinutes} min</dd>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <dt className="text-soft">Parkings partenaires</dt>
                  <dd className="font-bold text-ink">{facts.partners}</dd>
                </div>
              </dl>
            )}
            <Link href={`/${BLOG_AIRPORT}/recherche${stayQuery(stay)}`} className="btn-primary w-full px-5 text-center" data-testid="blog-cta">
              Voir les parkings pour mes dates
            </Link>
          </div>
          {guides.length > 0 && (
            <nav aria-labelledby="a-lire-aussi" className="card px-5 pt-5 pb-2">
              <h2 id="a-lire-aussi" className="eyebrow mb-1.5">
                À lire aussi
              </h2>
              <ul className="divide-y divide-line-soft">
                {guides.map(g => (
                  <li key={g.href}>
                    <Link href={g.href} className="flex min-h-11 items-center justify-between gap-3 py-2 text-[15px] font-semibold text-ink hover:text-accent-dark">
                      {g.short}
                      <span className="text-mute">
                        <ChevronIcon direction="right" size={16} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </aside>
      </div>

      {article.others.length > 0 && (
        <section aria-labelledby="derniers-articles" className="flex flex-col gap-4">
          <h2 id="derniers-articles" className="font-title text-[24px] text-ink">
            Derniers articles
          </h2>
          <BlogCards articles={article.others} />
        </section>
      )}
    </main>
  );
}

export function BlogCards({ articles }: { articles: { slug: string; title: string; intro: string | null; publishedAt: string }[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map(a => (
        <li key={a.slug}>
          <Link href={blogPath(a.slug)} className="card flex h-full flex-col gap-2 p-5 hover:border-accent">
            <span className="eyebrow">{blogDate(a.publishedAt)}</span>
            <span className="font-title text-[19px] leading-snug text-ink">{a.title}</span>
            {a.intro && <span className="line-clamp-3 text-[14px] leading-[1.55] text-soft">{a.intro}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
