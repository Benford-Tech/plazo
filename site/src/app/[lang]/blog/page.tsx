import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { BlogCards } from "@/components/blog/BlogArticleView";
import { api } from "@/lib/api";
import { BLOG_PATH, type BlogSummary } from "@/lib/blog";
import { enterLocaleFrom } from "@/lib/i18n/server";
import { PRODUCT_NAME } from "@/lib/product";
import { openGraph } from "@/lib/seo";

export const revalidate = 300;

const TITLE = "Blog : conseils pour se garer à l'aéroport de Lyon";
const DESCRIPTION = "Nos conseils pour réserver votre parking à Lyon Saint-Exupéry : périodes de départ, navette, voiturier, prix et imprévus.";

export async function generateMetadata({ params }: PageProps<"/[lang]/blog">): Promise<Metadata> {
  await enterLocaleFrom(params);
  return {
    title: { absolute: `${TITLE} · ${PRODUCT_NAME}` },
    description: DESCRIPTION,
    alternates: { canonical: BLOG_PATH },
    openGraph: openGraph({ title: TITLE, description: DESCRIPTION, url: BLOG_PATH }),
  };
}

/** 26/11/2026: the blog's articles, newest first (French only). */
export default async function BlogPage({ params }: PageProps<"/[lang]/blog">) {
  const locale = await enterLocaleFrom(params);
  if (locale !== "fr") permanentRedirect(BLOG_PATH);
  let articles: BlogSummary[] = [];
  try {
    articles = (await api.blog()).articles;
  } catch {
    articles = [];
  }
  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-4 pt-4 pb-12 md:px-12 md:pt-[26px] md:pb-16">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Blog" }]} />
      <h1 className="font-title max-w-[19em] text-[30px] leading-[1.12] text-ink md:text-[44px]">{TITLE}</h1>
      <p className="max-w-[65ch] text-[17px] leading-[1.65] text-soft">{DESCRIPTION}</p>
      {articles.length ? <BlogCards articles={articles} /> : <p className="card p-5 text-soft">Les premiers articles arrivent bientôt.</p>}
    </main>
  );
}
