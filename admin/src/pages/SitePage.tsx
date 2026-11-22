import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ExternalLink, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { PlazoTabs } from "@/components/plazo/PlazoTabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, ApiError } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import type { SiteBlock, SiteSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = fr.site;
const card = "flex flex-col gap-3 rounded-[14px] border border-border bg-card p-4 md:p-5";
const label = "text-[13px] font-semibold uppercase tracking-wide text-muted-foreground";
const input = "h-11 w-full rounded-[10px] border border-border bg-white px-3 text-[15px]";
const euros = (cents: number) => `${(cents / 100).toLocaleString("fr-FR")} €`;
const day = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });

/** The first field the server refused, in words. */
function siteError(err: unknown): string {
  if (err instanceof ApiError && err.fields) {
    const code = Object.values(err.fields)[0];
    if (code && t.errors[code]) return t.errors[code];
  }
  return describeError(err);
}

function Switch({ checked, onChange, label: name, disabled }: { checked: boolean; onChange: (on: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={name}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50", checked ? "bg-lime-deep" : "bg-[#C9CEC8]")}
    >
      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all", checked ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

/**
 * « Mon site » (22/11/2026, « pouvoir créer un site dédié au parking », « le plus modulaire possible », « le site est en
 * supplément »): the parking's own site, made of blocks. The manager orders them, switches them, retitles them and adds
 * texts of his own; the address and the colour beside; the preview, then the publication, which needs the paid option.
 */
export default function SitePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const readOnly = !!user?.demo;
  const query = useQuery({ queryKey: ["site"], queryFn: adminApi.getSite });
  const site = query.data?.data;
  const [blocks, setBlocks] = useState<SiteBlock[] | null>(null);
  const [slug, setSlug] = useState("");
  const [accent, setAccent] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  // The form follows the server until the manager touches it.
  useEffect(() => {
    if (!site) return;
    setBlocks(site.blocks);
    setSlug(site.slug);
    setAccent(site.accent);
  }, [site]);

  const store = (data: SiteSettings) => queryClient.setQueryData(["site"], { data });
  const save = useMutation({
    mutationFn: () =>
      adminApi.updateSite({ blocks: (blocks ?? []).map(({ kind, enabled, title, text }) => ({ kind, enabled, title, text })), slug, accent }),
    onSuccess: (res) => {
      store(res.data);
      toast.success(t.saved);
    },
    onError: (err) => toast.error(siteError(err)),
  });
  const publish = useMutation({
    mutationFn: (published: boolean) => adminApi.updateSite({ published }),
    onSuccess: (res) => {
      store(res.data);
      toast.success(res.data.published ? t.published : t.unpublished);
    },
    onError: (err) => toast.error(siteError(err)),
  });
  const request = useMutation({
    mutationFn: adminApi.requestSite,
    onSuccess: (res) => {
      store(res.data);
      toast.success(t.requested);
    },
    onError: (err) => toast.error(describeError(err)),
  });

  if (query.isLoading || !site || !blocks) {
    return (
      <>
        <PlazoTabs />
        {query.error ? <p className="text-destructive">{describeError(query.error)}</p> : <Skeleton className="h-64" />}
      </>
    );
  }

  const dirty = slug !== site.slug || accent !== site.accent || JSON.stringify(blocks) !== JSON.stringify(site.blocks);
  const change = (id: string, patch: Partial<SiteBlock>) => setBlocks(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const move = (index: number, by: number) => {
    const next = [...blocks];
    const [block] = next.splice(index, 1);
    next.splice(index + by, 0, block);
    setBlocks(next);
  };
  const addText = () => {
    const id = `new-${Date.now()}`;
    setBlocks([...blocks, { id, kind: "text", enabled: true, title: null, text: t.newText }]);
    setOpen(id);
  };
  const name = (b: SiteBlock) => (b.kind === "text" && b.title ? b.title : t.kinds[b.kind] ?? b.kind);

  return (
    <>
      <PlazoTabs
        right={
          <>
            {dirty && <span className="hidden text-sm text-muted-foreground sm:inline">{t.unsaved}</span>}
            <Button type="button" className="h-11 bg-lime font-bold text-lime-ink hover:bg-lime/90" disabled={!dirty || readOnly || save.isPending} onClick={() => save.mutate()}>
              {t.save}
            </Button>
          </>
        }
      />
      <div className="space-y-1">
        <h1 className="font-narrow text-2xl font-bold text-lime-deep md:text-[30px]">{t.title}</h1>
        <p className="max-w-3xl text-muted-foreground">{t.intro}</p>
        {readOnly && <p className="text-sm text-muted-foreground">{t.demo}</p>}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className={card} aria-labelledby="site-blocks">
          <div>
            <h2 id="site-blocks" className="font-narrow text-xl font-bold">
              {t.blocksTitle}
            </h2>
            <p className="text-sm text-muted-foreground">{t.blocksHint}</p>
          </div>
          <ol className="flex flex-col gap-2" data-testid="site-blocks">
            {blocks.map((b, i) => (
              <li
                key={b.id}
                data-testid={`site-block-${b.kind}`}
                className={cn("rounded-[12px] border bg-white", b.enabled ? "border-border" : "border-dashed border-border opacity-70")}
              >
                <div className="flex items-center gap-1.5 p-2">
                  <div className="flex shrink-0 flex-col">
                    <button type="button" aria-label={t.up(name(b))} disabled={i === 0} onClick={() => move(i, -1)} className="flex h-6 w-9 items-center justify-center rounded text-muted-foreground hover:bg-accent disabled:opacity-30">
                      <ArrowUp className="h-4 w-4" aria-hidden />
                    </button>
                    <button type="button" aria-label={t.down(name(b))} disabled={i === blocks.length - 1} onClick={() => move(i, 1)} className="flex h-6 w-9 items-center justify-center rounded text-muted-foreground hover:bg-accent disabled:opacity-30">
                      <ArrowDown className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                  <button type="button" aria-expanded={open === b.id} onClick={() => setOpen(open === b.id ? null : b.id)} className="flex min-h-11 min-w-0 flex-1 flex-col justify-center text-left">
                    <span className="truncate font-semibold">{b.title && b.kind !== "text" ? `${b.title} · ${t.kinds[b.kind]}` : name(b)}</span>
                    <span className="truncate text-xs text-muted-foreground">{b.kind === "text" ? (b.text ?? "").slice(0, 80) : t.sources[b.kind]}</span>
                  </button>
                  <Switch checked={b.enabled} disabled={b.kind === "booking"} label={t.show(name(b))} onChange={(on) => change(b.id, { enabled: on })} />
                </div>
                {open === b.id && (
                  <div className="flex flex-col gap-2 border-t border-border p-3">
                    <label className="flex flex-col gap-1">
                      <span className={label}>{t.blockTitle}</span>
                      <input
                        className={input}
                        maxLength={80}
                        value={b.title ?? ""}
                        placeholder={b.kind === "text" ? "" : t.kinds[b.kind]}
                        onChange={(e) => change(b.id, { title: e.target.value || null })}
                      />
                      {b.kind !== "text" && <span className="text-xs text-muted-foreground">{t.blockTitleHint}</span>}
                    </label>
                    {b.kind === "text" && (
                      <>
                        <label className="flex flex-col gap-1">
                          <span className={label}>{t.blockText}</span>
                          <textarea
                            className="min-h-28 w-full rounded-[10px] border border-border bg-white p-3 text-[15px]"
                            maxLength={1200}
                            value={b.text ?? ""}
                            onChange={(e) => change(b.id, { text: e.target.value })}
                          />
                        </label>
                        <button type="button" onClick={() => setBlocks(blocks.filter((x) => x.id !== b.id))} className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-destructive">
                          <Trash2 className="h-4 w-4" aria-hidden />
                          {t.remove}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ol>
          <button type="button" onClick={addText} disabled={blocks.filter((b) => b.kind === "text").length >= 6} className="min-h-11 rounded-[12px] border-2 border-dashed border-border font-semibold text-lime-deep hover:bg-accent disabled:opacity-50">
            {t.addText}
          </button>
        </section>

        <div className="flex flex-col gap-5">
          <section className={card} aria-labelledby="site-online">
            <div className="flex items-center gap-2">
              <h2 id="site-online" className="font-narrow text-xl font-bold">
                {t.onlineTitle}
              </h2>
              <span data-testid="site-state" className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", site.published ? "bg-ok-soft text-ok-text" : "bg-panel-2 text-muted-foreground")}>
                {site.published ? t.online : t.offline}
              </span>
            </div>
            {site.url && site.saved && <p className="break-all font-mono text-sm">{site.url.replace(/^https?:\/\//, "")}</p>}
            <div className="flex flex-wrap gap-2">
              {site.published && site.url ? (
                <a href={site.url} target="_blank" rel="noreferrer noopener" className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] border border-border px-3.5 font-semibold">
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  {t.open}
                </a>
              ) : site.previewUrl ? (
                <a href={site.previewUrl} target="_blank" rel="noreferrer noopener" className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] border border-border px-3.5 font-semibold">
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  {t.preview}
                </a>
              ) : null}
              {site.addon.active && (
                <Button
                  type="button"
                  className={cn("h-11 font-bold", !site.published && "bg-lime text-lime-ink hover:bg-lime/90")}
                  variant={site.published ? "outline" : "default"}
                  disabled={readOnly || publish.isPending || dirty || (!site.published && !site.listingOnline)}
                  onClick={() => publish.mutate(!site.published)}
                >
                  {site.published ? t.unpublish : t.publish}
                </Button>
              )}
            </div>
            {!site.previewUrl && !site.published && <p className="text-sm text-muted-foreground">{t.previewNeeds}</p>}
            {!site.listingOnline && (
              <p className="text-sm text-warn-text">
                {t.listingOffline} <Link to="/plazo/fiche" className="font-semibold underline">{fr.plazo.tabs.listing}</Link>
              </p>
            )}
            <p className="text-sm text-muted-foreground">{t.booksNote}</p>
          </section>

          {!site.addon.active && (
            <section className="flex flex-col gap-2 rounded-[14px] border border-lime-deep bg-[#F1F8E6] p-4 md:p-5" aria-labelledby="site-addon" data-testid="site-addon">
              <h2 id="site-addon" className="font-narrow text-xl font-bold text-lime-deep">
                {t.addonTitle}
              </h2>
              <p className="font-semibold">{t.addonPrice(euros(site.addon.priceCents))}</p>
              <p className="text-sm">{t.addonFree}</p>
              {site.addon.requestedAt ? (
                <p className="text-sm font-semibold text-lime-deep">{t.addonRequested(day.format(new Date(site.addon.requestedAt)))}</p>
              ) : (
                <Button type="button" className="h-11 self-start bg-lime font-bold text-lime-ink hover:bg-lime/90" disabled={readOnly || request.isPending} onClick={() => request.mutate()}>
                  {t.addonRequest}
                </Button>
              )}
            </section>
          )}

          <section className={card} aria-labelledby="site-settings">
            <h2 id="site-settings" className="font-narrow text-xl font-bold">
              {t.settingsTitle}
            </h2>
            <label className="flex flex-col gap-1">
              <span className={label}>{t.slug}</span>
              <span className="flex items-center gap-1.5">
                <span className="shrink-0 font-mono text-sm text-muted-foreground">plazo.fr/s/</span>
                <input className={cn(input, "font-mono")} value={slug} maxLength={40} onChange={(e) => setSlug(e.target.value)} />
              </span>
            </label>
            <label className="flex items-center gap-3">
              <span className={label}>{t.accent}</span>
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value.toUpperCase())} className="h-11 w-16 rounded-[10px] border border-border bg-white p-1" />
              <span className="font-mono text-sm">{accent}</span>
            </label>
          </section>
        </div>
      </div>
    </>
  );
}
