import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { asideFacts, BlogArticleView } from "@/components/blog/BlogArticleView";
import { ApiError, api } from "@/lib/api";
import { BLOG_AIRPORT, blogPath } from "@/lib/blog";
import { defaultStay } from "@/lib/dates";
import { enterLocaleFrom } from "@/lib/i18n/server";
import { PRODUCT_NAME } from "@/lib/product";
import { openGraph } from "@/lib/seo";
import { SLUG_RE } from "@/lib/site";
import type { SearchResponse } from "@/lib/types";

// 26/11/2026: built on shared reads (ISR); an article published by the platform appears within a few minutes.
export const revalidate = 300;
export function generateStaticParams() {
  return [];
}

type Props = PageProps<"/[lang]/blog/[slug]">;

const loadArticle = cache(async (slug: string) => {
  if (!SLUG_RE.test(slug)) notFound();
  try {
    return (await api.blogArticle(slug)).article;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await enterLocaleFrom(params);
  const { slug } = await params;
  const article = await loadArticle(slug);
  const title = article.metaTitle || article.title;
  const description = article.metaDescription ?? article.intro ?? undefined;
  const path = blogPath(article.slug);
  return {
    title: { absolute: `${title} · ${PRODUCT_NAME}` },
    description,
    alternates: { canonical: path },
    openGraph: openGraph({ title, description: description ?? "", url: path, type: "article" }),
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const locale = await enterLocaleFrom(params);
  const { slug } = await params;
  const article = await loadArticle(slug);
  // Written in French only: the other languages read the French page.
  if (locale !== "fr") permanentRedirect(blogPath(article.slug));
  const stay = defaultStay();
  let preview: SearchResponse | null = null;
  try {
    preview = await api.sharedSearch(BLOG_AIRPORT, stay.arrivee, stay.retour);
  } catch {
    preview = null;
  }
  return <BlogArticleView article={article} facts={asideFacts(preview)} stay={stay} />;
}
