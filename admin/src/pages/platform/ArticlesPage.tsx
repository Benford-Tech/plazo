import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-context";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, adminApi } from "@/lib/api";
import { longDate, shortDay } from "@/lib/datetime";
import { describeError, fr } from "@/lib/fr";
import type { BlogArticle, BlogArticleEdit, BlogArticleStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = fr.platform.articles;
const SITE = "https://www.plazo.fr";
const number = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

const PILL: Record<BlogArticleStatus, string> = {
  planned: "bg-muted text-muted-foreground",
  draft: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  published: "bg-green-100 text-lime-deep dark:bg-green-950",
  rejected: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const dayMonth = (day: string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));

function StatusPill({ status }: { status: BlogArticleStatus }) {
  return <span className={cn("inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-semibold", PILL[status])}>{t.status[status]}</span>;
}

/**
 * Plateforme › Articles (26/11/2026, B « Le calendrier de la semaine » of https://claude.ai/artifact/XpLKzf3Ur3MftvFbHmExzH): the
 * week of the blog's daily articles; a day opens its article in a drawer to read, correct, rewrite, publish or set aside.
 */
export default function ArticlesPage() {
  const [params, setParams] = useSearchParams();
  const monday = params.get("semaine");
  const openId = params.get("article");
  const week = useQuery({ queryKey: ["platform", "blog", monday], queryFn: () => adminApi.getBlogWeek(monday) });
  const w = week.data;
  const go = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    setParams(p, { replace: true });
  };
  const opened = w?.days.find((d) => d.article?.id === openId)?.article ?? null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.intro}</p>
        </div>
        {w ? (
          <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
            <button type="button" aria-label={t.previous} data-testid="blog-prev" className="min-h-9 rounded-full px-3 hover:bg-accent" onClick={() => go({ semaine: addDays(w.monday, -7), article: null })}>
              ‹
            </button>
            <span className="px-2 text-sm font-semibold">{t.week(dayMonth(w.monday))}</span>
            <button type="button" aria-label={t.next} data-testid="blog-next" className="min-h-9 rounded-full px-3 hover:bg-accent" onClick={() => go({ semaine: addDays(w.monday, 7), article: null })}>
              ›
            </button>
            {monday ? (
              <button type="button" className="min-h-9 rounded-full px-3 text-sm text-muted-foreground hover:bg-accent" onClick={() => go({ semaine: null, article: null })}>
                {t.thisWeek}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {week.error ? (
        <p className="text-destructive">{describeError(week.error) || t.loadError}</p>
      ) : !w ? (
        <div className="grid gap-2 md:grid-cols-7">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {!w.configured ? <p className="rounded-[14px] border border-border bg-card p-3 text-sm text-amber-800 dark:text-amber-300">{t.noKey}</p> : null}
          <div className="flex flex-wrap gap-3" data-testid="blog-counts">
            {[
              [w.counts.published, t.counts.published],
              [w.counts.toReview, t.counts.toReview],
              [w.counts.clicks, t.counts.clicks],
            ].map(([value, label]) => (
              <div key={label} className="rounded-[14px] border border-border bg-card px-4 py-2">
                <b className="block font-mono text-lg tabular-nums">{number(value as number)}</b>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
          <div className="grid gap-2 md:grid-cols-7" data-testid="blog-week">
            {w.days.map(({ day, article }) => (
              <DayCard
                key={day}
                day={day}
                today={day === w.today}
                article={article}
                selected={!!article && article.id === openId}
                onOpen={() => article && go({ article: article.id })}
                configured={w.configured}
              />
            ))}
          </div>
          {opened ? <ArticleDrawer key={opened.id} article={opened} onClose={() => go({ article: null })} /> : null}
        </>
      )}
    </div>
  );
}

function DayCard({
  day,
  today,
  article,
  selected,
  onOpen,
  configured,
}: {
  day: string;
  today: boolean;
  article: BlogArticle | null;
  selected: boolean;
  onOpen: () => void;
  configured: boolean;
}) {
  const queryClient = useQueryClient();
  const write = useMutation({
    mutationFn: () => adminApi.writeBlogDay(day),
    onSuccess: () => {
      toast.success(t.rewritten);
      void queryClient.invalidateQueries({ queryKey: ["platform", "blog"] });
    },
    onError: (error) => toast.error(describeError(error, t.errors)),
  });
  const canWrite = configured && (!article || article.status === "planned" || article.status === "failed");
  return (
    <div
      data-testid={`blog-day-${day}`}
      className={cn(
        "flex min-h-36 flex-col gap-1.5 rounded-[14px] border border-border bg-card p-2.5",
        today && "outline outline-2 outline-primary",
        selected && "outline outline-2 outline-lime-deep",
      )}
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {shortDay(day)}
        {today ? ` · ${t.today}` : ""}
      </span>
      {article ? (
        <button type="button" onClick={onOpen} className="flex flex-1 flex-col items-start gap-1.5 text-left" data-testid={`blog-open-${day}`}>
          <span className="text-sm font-semibold leading-snug">{article.status === "planned" ? t.plannedTopic(article.topic) : article.title ?? article.topic}</span>
          <StatusPill status={article.status} />
          {article.status === "published" && article.clicks !== null ? (
            <span className="font-mono text-xs text-muted-foreground">{t.clicks(article.clicks)}</span>
          ) : null}
        </button>
      ) : (
        <span className="flex-1 text-sm text-muted-foreground">{t.empty}</span>
      )}
      {canWrite ? (
        <button
          type="button"
          data-testid={`blog-write-${day}`}
          disabled={write.isPending}
          onClick={() => write.mutate()}
          className="min-h-8 rounded-full border border-border px-2 text-xs font-semibold hover:bg-accent disabled:opacity-60"
        >
          {write.isPending ? t.actions.writing : t.actions.writeNow}
        </button>
      ) : null}
    </div>
  );
}

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

function ArticleDrawer({ article, onClose }: { article: BlogArticle; onClose: () => void }) {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<BlogArticleEdit>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [instruction, setInstruction] = useState<string | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["platform", "blog"] });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onError = (error: unknown) => {
    if (error instanceof ApiError && error.fields) setFieldErrors(error.fields as Record<string, string>);
    toast.error(describeError(error, t.errors));
  };
  const save = useMutation({
    mutationFn: () => adminApi.updateBlogArticle(article.id, draft),
    onSuccess: () => {
      toast.success(t.saved);
      setEditing(false);
      setFieldErrors({});
      void refresh();
    },
    onError,
  });
  const act = useMutation({
    mutationFn: (action: "publish" | "unpublish" | "reject") => adminApi.blogArticleAction(article.id, action),
    onSuccess: (_r, action) => {
      toast.success(action === "publish" ? t.published : action === "unpublish" ? t.unpublished : t.rejected);
      void refresh();
    },
    onError,
  });
  const rewrite = useMutation({
    mutationFn: () => adminApi.rewriteBlogArticle(article.id, instruction ?? ""),
    onSuccess: () => {
      toast.success(t.rewritten);
      setInstruction(null);
      void refresh();
    },
    onError,
  });

  const ask = async (action: "publish" | "unpublish" | "reject") => {
    const title = action === "publish" ? t.confirmPublish : action === "unpublish" ? t.confirmUnpublish : t.confirmReject;
    const label = action === "publish" ? t.actions.publish : action === "unpublish" ? t.actions.unpublish : t.actions.reject;
    if (await confirm(title, { confirmLabel: label, destructive: action !== "publish" })) act.mutate(action);
  };
  const startEdit = () => {
    setDraft(
      article.status === "planned"
        ? { topic: article.topic, query: article.query }
        : {
            title: article.title,
            metaTitle: article.metaTitle,
            metaDescription: article.metaDescription,
            slug: article.slug,
            intro: article.intro,
            body: article.body,
          },
    );
    setFieldErrors({});
    setEditing(true);
  };
  const field = (key: keyof BlogArticleEdit, multiline = false) => (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-semibold">{t.fields[key as keyof typeof t.fields]}</span>
      {multiline ? (
        <textarea
          data-testid={`blog-field-${key}`}
          className={cn(input, key === "body" ? "min-h-[320px] font-mono text-[13px]" : "min-h-20")}
          value={(draft[key] as string | null) ?? ""}
          onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        />
      ) : (
        <input
          data-testid={`blog-field-${key}`}
          className={input}
          value={(draft[key] as string | null) ?? ""}
          onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        />
      )}
      {fieldErrors[key] ? <span className="text-xs text-destructive">{t.errors[fieldErrors[key]] ?? fieldErrors[key]}</span> : null}
    </label>
  );
  const written = !!article.body;
  const busy = save.isPending || act.isPending || rewrite.isPending;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={article.title ?? article.topic}
        data-testid="blog-drawer"
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-2xl flex-col gap-4 overflow-y-auto bg-background p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">
              {longDate(article.dueOn)}
              {article.query ? ` · ${t.query} : ${article.query}` : ""}
              {written ? ` · ${t.words(article.wordCount)}` : ""}
            </span>
            <StatusPill status={article.status} />
          </div>
          <button type="button" onClick={onClose} className="min-h-9 rounded-full border border-border px-3 text-sm hover:bg-accent">
            {t.close}
          </button>
        </div>

        {editing ? (
          <div className="flex flex-col gap-3">
            {article.status === "planned" ? (
              <>
                {field("topic")}
                {field("query")}
              </>
            ) : (
              <>
                {field("title")}
                {field("metaTitle")}
                {field("metaDescription", true)}
                {field("slug")}
                {field("intro", true)}
                {field("body", true)}
              </>
            )}
          </div>
        ) : written ? (
          <>
            <h2 className="font-serif text-2xl leading-tight">{article.title}</h2>
            {article.intro ? <p className="text-base font-medium">{article.intro}</p> : null}
            <section className="rounded-[14px] border border-border bg-card p-3 text-sm" data-testid="blog-checks">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">{t.checks}</h3>
              {article.warnings.length ? (
                <ul className="flex flex-col gap-1">
                  {article.warnings.map((w) => (
                    <li key={w} className="text-amber-800 dark:text-amber-300">
                      ! {w}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-lime-deep">✓ {t.noWarning}</p>
              )}
              {article.sources.length ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  {t.sources} : {article.sources.join(" · ")}
                </p>
              ) : null}
              {article.related.length ? (
                <p className="text-xs text-muted-foreground">
                  {t.related} : {article.related.join(", ")}
                </p>
              ) : null}
            </section>
            <section className="rounded-[10px] border border-dashed border-border p-3" data-testid="blog-serp">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">{t.serp}</h3>
              <p className="text-xs text-lime-deep">www.plazo.fr › blog › {article.slug}</p>
              <p className="text-[15px] text-[#1a0dab] dark:text-[#8ab4f8]">{article.metaTitle ?? article.title}</p>
              <p className="text-xs text-muted-foreground">{article.metaDescription}</p>
            </section>
            <ArticleBody body={article.body ?? ""} />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t.plannedTopic(article.topic)}. {article.status === "failed" ? t.failed : t.notWritten}
          </p>
        )}

        {instruction !== null ? (
          <div className="flex flex-col gap-2 rounded-[14px] border border-border bg-card p-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold">{t.instruction}</span>
              <textarea data-testid="blog-instruction" className={cn(input, "min-h-20")} maxLength={600} value={instruction} placeholder={t.instructionHint} onChange={(e) => setInstruction(e.target.value)} />
            </label>
            <div className="flex gap-2">
              <button type="button" disabled={busy} data-testid="blog-rewrite-go" onClick={() => rewrite.mutate()} className="min-h-9 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                {rewrite.isPending ? t.actions.writing : t.actions.rewriteGo}
              </button>
              <button type="button" onClick={() => setInstruction(null)} className="min-h-9 rounded-full border border-border px-4 text-sm">
                {t.actions.cancel}
              </button>
            </div>
          </div>
        ) : null}

        <div className="sticky bottom-0 mt-auto flex flex-wrap gap-2 border-t border-border bg-background pt-3">
          {editing ? (
            <>
              <button type="button" disabled={busy} data-testid="blog-save" onClick={() => save.mutate()} className="min-h-10 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                {t.actions.save}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="min-h-10 rounded-full border border-border px-4 text-sm">
                {t.actions.cancel}
              </button>
            </>
          ) : (
            <>
              {written && article.status !== "published" ? (
                <button type="button" disabled={busy} data-testid="blog-publish" onClick={() => void ask("publish")} className="min-h-10 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                  {t.actions.publish}
                </button>
              ) : null}
              {article.status === "published" && article.slug ? (
                <a href={`${SITE}/blog/${article.slug}`} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground">
                  {t.actions.view}
                </a>
              ) : null}
              <button type="button" disabled={busy} data-testid="blog-edit" onClick={startEdit} className="min-h-10 rounded-full border border-border px-4 text-sm hover:bg-accent">
                {t.actions.edit}
              </button>
              <button type="button" disabled={busy} data-testid="blog-rewrite" onClick={() => setInstruction("")} className="min-h-10 rounded-full border border-border px-4 text-sm hover:bg-accent">
                {t.actions.rewrite}
              </button>
              {article.status === "published" ? (
                <button type="button" disabled={busy} data-testid="blog-unpublish" onClick={() => void ask("unpublish")} className="min-h-10 rounded-full border border-border px-4 text-sm text-destructive">
                  {t.actions.unpublish}
                </button>
              ) : article.status !== "rejected" ? (
                <button type="button" disabled={busy} data-testid="blog-reject" onClick={() => void ask("reject")} className="min-h-10 rounded-full border border-border px-4 text-sm text-destructive">
                  {t.actions.reject}
                </button>
              ) : null}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

/** The body as the site shows it: « ## » headings, « - » lists, paragraphs. */
export function ArticleBody({ body }: { body: string }) {
  const blocks = body.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="flex flex-col gap-3 text-[15px] leading-relaxed" data-testid="blog-body">
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) return <h3 key={i} className="mt-2 font-serif text-lg">{block.slice(3)}</h3>;
        const lines = block.split("\n");
        if (lines.every((l) => l.startsWith("- ")))
          return (
            <ul key={i} className="ml-5 list-disc">
              {lines.map((l, j) => (
                <li key={j}>{l.slice(2)}</li>
              ))}
            </ul>
          );
        return <p key={i}>{lines.join(" ")}</p>;
      })}
    </div>
  );
}
