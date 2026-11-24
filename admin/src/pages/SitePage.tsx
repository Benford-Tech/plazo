import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Copy, ExternalLink, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { PlazoTabs } from "@/components/plazo/PlazoTabs";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-context";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, ApiError } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import { MAX_PHOTO_BYTES, shrinkPhoto } from "@/lib/shrink-photo";
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
    const [field, code] = Object.entries(err.fields)[0] ?? [];
    const text = t.errors[`${field}_${code}`] ?? (code ? t.errors[code] : undefined);
    if (text) return text;
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
  const [look, setLook] = useState<Look | null>(null);

  // The form follows the server until the manager touches it.
  useEffect(() => {
    if (!site) return;
    setBlocks(site.blocks);
    setSlug(site.slug);
    setAccent(site.accent);
    setLook(lookOf(site));
  }, [site]);

  const store = (data: SiteSettings) => queryClient.setQueryData(["site"], { data });
  const save = useMutation({
    mutationFn: () =>
      adminApi.updateSite({
        blocks: (blocks ?? []).map(({ kind, enabled, title, text }) => ({ kind, enabled, title, text })),
        slug,
        accent,
        ...(look
          ? {
              theme: look.theme,
              accent2: look.accent2,
              showLogo: look.showLogo,
              pages: look.pages,
              rating: look.rating.trim() ? { value: look.rating.trim(), count: look.ratingCount.trim() } : null,
            }
          : {}),
      }),
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

  if (query.isLoading || !site || !blocks || !look) {
    return (
      <>
        <PlazoTabs />
        {query.error ? <p className="text-destructive">{describeError(query.error)}</p> : <Skeleton className="h-64" />}
      </>
    );
  }

  const dirty =
    slug !== site.slug ||
    accent !== site.accent ||
    JSON.stringify(blocks) !== JSON.stringify(site.blocks) ||
    JSON.stringify(look) !== JSON.stringify(lookOf(site));
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

          <DomainSection site={site} readOnly={readOnly} onChange={store} />

          <LookSection site={site} look={look} accent={accent} readOnly={readOnly} onChange={setLook} onPhoto={store} />

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

/** What the manager sets for the look, as the form holds it. */
interface Look {
  theme: SiteSettings["theme"];
  accent2: string | null;
  showLogo: boolean;
  pages: boolean;
  rating: string;
  ratingCount: string;
}
const lookOf = (site: SiteSettings): Look => ({
  theme: site.theme ?? "simple",
  accent2: site.accent2 ?? null,
  showLogo: !!site.showLogo,
  pages: !!site.pages,
  rating: site.rating ? String(site.rating.value).replace(".", ",") : "",
  ratingCount: site.rating?.count ? String(site.rating.count) : "",
});

/** One photo of the site: shown, sent as soon as it is picked, changed or removed. */
function PhotoField({
  title,
  hint,
  alt,
  url,
  readOnly,
  send,
  remove,
  onPhoto,
}: {
  title: string;
  hint: string;
  alt: string;
  url: string | null;
  readOnly: boolean;
  send: (photo: Blob) => Promise<{ data: SiteSettings }>;
  remove: () => Promise<{ data: SiteSettings }>;
  onPhoto: (data: SiteSettings) => void;
}) {
  const l = t.look;
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (picked: File | undefined) => {
    if (!picked || busy) return;
    setBusy(true);
    try {
      const photo = await shrinkPhoto(picked);
      if (!photo) return void toast.error(l.photoUnreadable);
      if (photo.size > MAX_PHOTO_BYTES) return void toast.error(l.photoTooLarge);
      onPhoto((await send(photo)).data);
      toast.success(l.photoSaved);
    } catch (err) {
      const fields = err instanceof ApiError ? err.fields : undefined;
      if (fields?.photo === "too_large") toast.error(l.photoTooLarge);
      else if (fields?.photo) toast.error(l.photoUnreadable);
      else if (err instanceof ApiError && err.code === "photos_unavailable") toast.error(l.photoUnavailable);
      else toast.error(describeError(err));
    } finally {
      setBusy(false);
      if (file.current) file.current.value = "";
    }
  };
  const drop = async () => {
    setBusy(true);
    try {
      onPhoto((await remove()).data);
      toast.success(l.photoRemoved);
    } catch (err) {
      toast.error(describeError(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <span className={label}>{title}</span>
      {url && <img src={url} alt={alt} className="h-28 w-full rounded-[10px] border border-border object-cover" />}
      <input ref={file} type="file" accept="image/*" className="sr-only" aria-label={title} disabled={readOnly || busy} onChange={(e) => pick(e.target.files?.[0])} />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" className="h-11 font-semibold" disabled={readOnly || busy} onClick={() => file.current?.click()}>
          {url ? l.photoChange : l.photoAdd}
        </Button>
        {url && (
          <button type="button" disabled={readOnly || busy} onClick={drop} className="min-h-11 px-2 text-sm font-semibold text-destructive disabled:opacity-50">
            {l.photoRemove}
          </button>
        )}
      </div>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </div>
  );
}

/**
 * « Présentation » (24/11/2026, « je veux pouvoir faire des sites comme celui-ci », choix B): the style, a second colour,
 * the photo behind the title, the logo, the Google rating the manager types, and several pages. The photo is sent at
 * once; the rest is saved with the page.
 */
function LookSection({
  site,
  look,
  accent,
  readOnly,
  onChange,
  onPhoto,
}: {
  site: SiteSettings;
  look: Look;
  accent: string;
  readOnly: boolean;
  onChange: (look: Look) => void;
  onPhoto: (data: SiteSettings) => void;
}) {
  const l = t.look;
  const set = (patch: Partial<Look>) => onChange({ ...look, ...patch });

  return (
    <section className={card} aria-labelledby="site-look" data-testid="site-look">
      <h2 id="site-look" className="font-narrow text-xl font-bold">
        {l.title}
      </h2>
      <div className="flex flex-col gap-1">
        <span className={label}>{l.theme}</span>
        <div role="group" aria-label={l.theme} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(["simple", "showcase", "night", "postcard", "home", "express", "park", "valet"] as const).map((theme) => (
            <button
              key={theme}
              type="button"
              aria-pressed={look.theme === theme}
              onClick={() => set({ theme })}
              className={cn("min-h-11 rounded-[10px] border px-3 font-semibold", look.theme === theme ? "border-lime-deep bg-[#F1F8E6] text-lime-deep" : "border-border bg-white")}
            >
              {l.themes[theme]}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground" data-testid="site-theme-hint">
          {l.themeHints[look.theme]}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-3">
          <input type="checkbox" className="h-5 w-5" checked={look.accent2 !== null} onChange={(e) => set({ accent2: e.target.checked ? "#F2B705" : null })} />
          <span className="font-semibold">{l.accent2}</span>
          {look.accent2 !== null && (
            <input type="color" aria-label={l.accent2} value={look.accent2} onChange={(e) => set({ accent2: e.target.value.toUpperCase() })} className="h-11 w-16 rounded-[10px] border border-border bg-white p-1" />
          )}
          <span aria-hidden className="ml-auto flex gap-1">
            <span className="h-5 w-5 rounded-full border border-border" style={{ background: accent }} />
            {look.accent2 && <span className="h-5 w-5 rounded-full border border-border" style={{ background: look.accent2 }} />}
          </span>
        </label>
        <span className="text-xs text-muted-foreground">{l.accent2Hint}</span>
      </div>

      <PhotoField
        title={l.photo}
        hint={l.photoHint}
        alt={l.photoAlt}
        url={site.heroPhotoUrl}
        readOnly={readOnly}
        send={adminApi.setSiteHeroPhoto}
        remove={adminApi.removeSiteHeroPhoto}
        onPhoto={onPhoto}
      />
      {look.theme === "home" && (
        <PhotoField
          title={l.teamPhoto}
          hint={l.teamPhotoHint}
          alt={l.teamPhotoAlt}
          url={site.teamPhotoUrl}
          readOnly={readOnly}
          send={adminApi.setSiteTeamPhoto}
          remove={adminApi.removeSiteTeamPhoto}
          onPhoto={onPhoto}
        />
      )}

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold">{l.logo}</span>
          <Switch checked={look.showLogo} label={l.logo} onChange={(on) => set({ showLogo: on })} />
        </div>
        {!site.hasLogo && (
          <span className="text-xs text-muted-foreground">
            {l.logoMissing} <Link to="/parking/reglages" className="font-semibold underline">{l.logoLink}</Link>.
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className={label}>{l.rating}</span>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-sm">
            {l.ratingValue}
            <input className={input} inputMode="decimal" placeholder="4,8" value={look.rating} onChange={(e) => set({ rating: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {l.ratingCount}
            <input className={input} inputMode="numeric" placeholder="193" value={look.ratingCount} onChange={(e) => set({ ratingCount: e.target.value.replace(/\D/g, "") })} />
          </label>
        </div>
        <span className="text-xs text-muted-foreground">{l.ratingHint}</span>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold">{l.pages}</span>
          <Switch checked={look.pages} label={l.pages} onChange={(on) => set({ pages: on })} />
        </div>
        <span className="text-xs text-muted-foreground">{l.pagesHint}</span>
      </div>
    </section>
  );
}

const time = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

/**
 * « Votre nom de domaine » (22/11/2026, « le nom de domaine du parking »): the manager types his own host name, creates
 * the one DNS record shown at his registrar, and follows where it stands until the site answers on it.
 */
function DomainSection({ site, readOnly, onChange }: { site: SiteSettings; readOnly: boolean; onChange: (data: SiteSettings) => void }) {
  const d = t.domain;
  const confirm = useConfirm();
  const [value, setValue] = useState("");
  const set = useMutation({
    mutationFn: (domain: string | null) => adminApi.setSiteDomain(domain),
    onSuccess: (res, domain) => {
      onChange(res.data);
      setValue("");
      if (domain === null) toast.success(d.removed);
    },
    onError: (err) => toast.error(siteError(err)),
  });
  const check = useMutation({
    mutationFn: adminApi.checkSiteDomain,
    onSuccess: (res) => onChange(res.data),
    onError: (err) => toast.error(describeError(err)),
  });
  const domain = site.domain;
  const state = domain ? (domain.active ? "active" : (domain.issue ?? "dns_missing")) : null;
  const detail = !state ? null : state === "not_attached" ? d.details[domain?.automatic ? "not_attached_auto" : "not_attached_manual"] : d.details[state];
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(d.copied);
    } catch {
      // No clipboard here: the value stays selectable.
    }
  };

  return (
    <section className={card} aria-labelledby="site-domain" data-testid="site-domain">
      <h2 id="site-domain" className="font-narrow text-xl font-bold">
        {d.title}
      </h2>
      {!domain ? (
        <>
          <p className="text-sm text-muted-foreground">{d.intro}</p>
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (value.trim()) set.mutate(value.trim());
            }}
          >
            <label className="flex flex-col gap-1">
              <span className={label}>{d.field}</span>
              <input className={cn(input, "font-mono")} value={value} placeholder={d.placeholder} autoCapitalize="none" autoCorrect="off" spellCheck={false} onChange={(e) => setValue(e.target.value)} />
            </label>
            <p className="text-xs text-muted-foreground">{d.hint}</p>
            <Button type="submit" className="h-11 self-start bg-lime font-bold text-lime-ink hover:bg-lime/90" disabled={readOnly || set.isPending || !value.trim()}>
              {d.save}
            </Button>
          </form>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="break-all font-mono text-[15px] font-semibold">{domain.name}</span>
            <span data-testid="site-domain-state" className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", domain.active ? "bg-ok-soft text-ok-text" : "bg-warn-soft text-warn-text")}>
              {d.states[state ?? "dns_missing"]}
            </span>
          </div>
          {detail && <p className="text-sm">{detail}</p>}
          {domain.active && !site.published && <p className="text-sm text-muted-foreground">{d.offlineNote}</p>}
          {!domain.active && (
            <div className="flex flex-col gap-1.5 rounded-[12px] bg-panel-2 p-3">
              <p className={label}>{d.recordTitle}</p>
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
                <dt className="text-muted-foreground">{d.recordType}</dt>
                <dd className="font-mono font-semibold">{domain.record.type}</dd>
                <dt className="text-muted-foreground">{d.recordName}</dt>
                <dd className="font-mono font-semibold">{domain.record.name}</dd>
                <dt className="text-muted-foreground">{d.recordValue}</dt>
                <dd className="flex items-center gap-2">
                  <span className="break-all font-mono font-semibold select-all">{domain.record.value}</span>
                  <button type="button" aria-label={d.copy} onClick={() => copy(domain.record.value)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md hover:bg-accent">
                    <Copy className="h-4 w-4" aria-hidden />
                  </button>
                </dd>
              </dl>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {!domain.active && (
              <Button type="button" variant="outline" className="h-11 font-semibold" disabled={readOnly || check.isPending} onClick={() => check.mutate()}>
                {d.check}
              </Button>
            )}
            <button
              type="button"
              disabled={readOnly || set.isPending}
              onClick={async () => {
                if (await confirm(d.removeConfirm, { destructive: true, confirmLabel: d.remove })) set.mutate(null);
              }}
              className="min-h-11 px-2 text-sm font-semibold text-destructive disabled:opacity-50"
            >
              {d.remove}
            </button>
            {domain.checkedAt && <span className="ml-auto text-xs text-muted-foreground">{d.checked(time.format(new Date(domain.checkedAt)))}</span>}
          </div>
        </>
      )}
    </section>
  );
}
