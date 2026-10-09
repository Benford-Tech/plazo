import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ListingPreview } from "@/components/plazo/ListingPreview";
import { OnlinePayments } from "@/components/plazo/OnlinePayments";
import { PlazoTabs } from "@/components/plazo/PlazoTabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, ApiError } from "@/lib/api";
import { describeError, errorMessage, fr } from "@/lib/fr";
import { slugify } from "@/lib/pricing";
import { LISTING_TONE } from "@/lib/platform";
import type { CancellationPolicy, DescriptionSuggestion, Listing, ListingInput, ListingResponse, ListingService } from "@/lib/types";
import { cn } from "@/lib/utils";

const SERVICES: ListingService[] = ["shuttle", "open_24h", "fenced", "cctv", "valet", "covered", "ev_charging"];
const POLICIES: CancellationPolicy[] = ["free_24h", "free_48h", "free_until_arrival", "non_refundable"];
// The listing's own limit (UpdateListingDto.description).
const DESCRIPTION_MAX = 2000;
// The traveller site shares the domain (served at /); VITE_SITE_URL points elsewhere in development.
const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "").replace(/\/$/, "");

const labelClass = "mb-1 block text-[13px] font-semibold uppercase tracking-wide text-muted-foreground";
const inputClass = "h-11 w-full border border-border bg-card px-3 text-lg outline-none focus-visible:border-lime-deep aria-[invalid=true]:border-destructive";

type Form = {
  title: string;
  slug: string;
  description: string;
  services: ListingService[];
  shuttleMinutes: string;
  distanceKm: string;
  openingHours: string;
  cancellationPolicy: CancellationPolicy;
  photos: string[];
};

function initialForm(data: ListingResponse): Form {
  const l = data.listing;
  return {
    title: l?.title ?? data.parking.name,
    slug: l?.slug ?? slugify(data.parking.name),
    description: l?.description ?? "",
    services: l?.services ?? ["shuttle"],
    shuttleMinutes: String(l?.shuttleMinutes ?? data.parking.shuttleTravelMinutes ?? ""),
    distanceKm: l?.distanceKm !== null && l?.distanceKm !== undefined ? String(l.distanceKm).replace(".", ",") : "",
    openingHours: l?.openingHours ?? "",
    cancellationPolicy: l?.cancellationPolicy ?? "free_24h",
    photos: l?.photos ?? [],
  };
}

function toInput(form: Form, airportCode: string): ListingInput {
  const minutes = form.shuttleMinutes.trim() ? Number(form.shuttleMinutes) : null;
  const km = form.distanceKm.trim() ? Number(form.distanceKm.replace(",", ".")) : null;
  return {
    airportCode,
    slug: form.slug.trim(),
    title: form.title,
    description: form.description.trim() || null,
    services: form.services,
    shuttleMinutes: minutes,
    distanceKm: km,
    openingHours: form.openingHours.trim() || null,
    cancellationPolicy: form.cancellationPolicy,
    photos: form.photos,
  };
}

export default function ListingPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const listing = useQuery({ queryKey: ["listing"], queryFn: adminApi.getListing });
  const pricing = useQuery({ queryKey: ["pricing"], queryFn: adminApi.getPricing });
  const [form, setForm] = useState<Form | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [proposal, setProposal] = useState<DescriptionSuggestion | null>(null);
  const t = fr.plazo;

  useEffect(() => {
    if (listing.data && !form) setForm(initialForm(listing.data));
  }, [listing.data, form]);

  const current = listing.data?.listing ?? null;
  const status = current?.status ?? "draft";
  const published = status === "published";
  const airportCode = current?.airport.code ?? "LYS";
  // A self sign-up confirms its email before its page can be sent (a platform admin viewing the space has).
  const emailPending = user?.emailVerified === false && !user.viewAs;

  const keep = (data: Listing) => queryClient.setQueryData(["listing"], { ...listing.data, listing: data });
  const onError = (err: Error) => {
    setFieldErrors(err instanceof ApiError ? (err.fields ?? {}) : {});
    toast.error(describeError(err));
  };

  const save = useMutation({
    mutationFn: () => adminApi.updateListing(toInput(form!, airportCode)),
    onSuccess: ({ data }) => {
      setFieldErrors({});
      keep(data);
      toast.success(t.saved);
    },
    onError,
  });

  // "Envoyer pour validation" saves what is on screen first, then sends it.
  const submit = useMutation({
    mutationFn: async () => {
      keep((await adminApi.updateListing(toInput(form!, airportCode))).data);
      return adminApi.submitListing();
    },
    onSuccess: ({ data }) => {
      setFieldErrors({});
      keep(data);
      toast.success(t.submitted);
    },
    onError,
  });

  // 09/10/2026: Claude writes the « Présentation » from the saved page and the parking's settings, or improves the
  // text in the field; nothing is saved until the manager clicks « Enregistrer ».
  const write = useMutation({
    mutationFn: () => adminApi.suggestListingDescription(form!.description.trim() || null),
    onSuccess: data => setProposal(data),
    onError: (err: Error) => {
      if (err instanceof ApiError && err.code === "ai_unreliable") {
        const figures = (err.details as { figures?: string[] } | undefined)?.figures ?? [];
        toast.error(t.writing.unreliable(figures), { duration: 12000 });
        return;
      }
      const reason = err instanceof ApiError && err.code === "ai_failed" ? (err.details as { reason?: string } | undefined)?.reason : undefined;
      const message = describeError(err, t.writing.errors);
      toast.error(reason ? `${message} (${reason})` : message, { duration: 12000 });
    },
  });

  const withdraw = useMutation({
    mutationFn: adminApi.withdrawListing,
    onSuccess: ({ data }) => {
      keep(data);
      toast.success(status === "published" ? t.withdrawn : t.requestCancelled);
    },
    onError,
  });

  if (listing.isLoading || !form) return <Skeleton className="h-[600px] w-full" />;

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [key]: e.target.value });
  const toggleService = (s: ListingService) =>
    setForm({ ...form, services: form.services.includes(s) ? form.services.filter(x => x !== s) : [...form.services, s] });
  const addPhoto = () => {
    const url = photoUrl.trim();
    if (!/^https:\/\/\S+$/.test(url)) {
      setFieldErrors({ ...fieldErrors, photos: "invalid_url" });
      return;
    }
    setForm({ ...form, photos: [...form.photos, url].slice(0, 12) });
    setPhotoUrl("");
    setFieldErrors({ ...fieldErrors, photos: "" });
  };
  const prices = pricing.data?.tiers.map(x => x.priceCents) ?? [];
  const airportName = listing.data?.listing?.airport.name ?? "Lyon Saint-Exupéry";
  const pageUrl = published ? `${SITE_URL}/${current?.airport.slug}/${current?.slug}` : null;
  const busy = save.isPending || submit.isPending || withdraw.isPending;
  const err = (k: string) => (fieldErrors[k] ? <p className="mt-1 text-sm text-destructive">{errorMessage(fieldErrors[k])}</p> : null);

  return (
    <>
      <OnlinePayments />
      <PlazoTabs
        right={
          <>
            <span className={cn("font-bold uppercase", LISTING_TONE[status])}>
              <span aria-hidden="true">● </span>
              {fr.listingStatus[status]}
            </span>
            {(status === "draft" || status === "rejected") && (
              <button
                type="button"
                onClick={() => submit.mutate()}
                disabled={busy || emailPending}
                title={emailPending ? t.verifyFirst : undefined}
                className="min-h-11 bg-primary px-4 font-bold uppercase tracking-wide text-primary-foreground hover:brightness-110 disabled:opacity-50"
              >
                {t.submit}
              </button>
            )}
            {(status === "pending_review" || status === "published") && (
              <button type="button" onClick={() => withdraw.mutate()} disabled={busy} className="min-h-11 border border-border px-4 font-semibold uppercase hover:bg-accent disabled:opacity-50">
                {status === "published" ? t.withdraw : t.cancelRequest}
              </button>
            )}
          </>
        }
      />
      {params.get("bienvenue") && (
        <div role="status" className="border border-lime-deep p-4">
          <p className="text-lg font-bold uppercase tracking-wide text-lime-deep">{fr.onboarding.title}</p>
          <ol className="mt-1 list-decimal pl-5 text-base">
            {fr.onboarding.steps.map(step => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-muted-foreground">{emailPending && status !== "published" ? t.verifyFirst : t.statusHelp[status]}</p>
        {current?.reviewMessage && (status === "rejected" || status === "draft") && (
          <p className="border-l-2 border-lime-deep pl-3">
            <span className="block text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">{t.reviewMessage}</span>
            {current.reviewMessage}
          </p>
        )}
      </div>
      <div className="grid gap-7 lg:grid-cols-[1fr_380px]">
        <form
          className="flex flex-col gap-4"
          onSubmit={e => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <p className="text-muted-foreground">
            {t.airport} : <b className="text-foreground">{airportName}</b>
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="l-title" className={labelClass}>
                {t.title}
              </label>
              <input id="l-title" required value={form.title} onChange={set("title")} aria-invalid={!!fieldErrors.title} className={inputClass} />
              {err("title")}
            </div>
            <div>
              <label htmlFor="l-slug" className={labelClass}>
                {t.slug}
              </label>
              <input id="l-slug" required value={form.slug} onChange={set("slug")} aria-invalid={!!fieldErrors.slug} className={cn(inputClass, "tabular font-mono")} />
              {err("slug") ?? (
                <p className="mt-1 text-sm text-muted-foreground">
                  plazo/{listing.data?.listing?.airport.slug ?? "lyon-saint-exupery"}/<b className="text-foreground">{form.slug || "…"}</b>
                </p>
              )}
            </div>
          </div>
          <div>
            <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
              <label htmlFor="l-desc" className={cn(labelClass, "mb-0")}>
                {t.description}
              </label>
              <button
                type="button"
                onClick={() => write.mutate()}
                disabled={write.isPending}
                className="flex min-h-9 items-center gap-1.5 border border-border px-3 text-sm font-semibold hover:bg-accent disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4 text-lime-deep" aria-hidden="true" />
                {write.isPending ? t.writing.busy : form.description.trim() ? t.writing.improve : t.writing.write}
              </button>
            </div>
            <textarea
              id="l-desc"
              rows={5}
              maxLength={DESCRIPTION_MAX}
              value={form.description}
              onChange={set("description")}
              aria-invalid={!!fieldErrors.description}
              aria-describedby="l-desc-help"
              className={cn(inputClass, "h-auto py-2 text-base")}
            />
            <div className="mt-1 flex items-start justify-between gap-3">
              {err("description") ?? (
                <p id="l-desc-help" className="text-sm text-muted-foreground">
                  {t.descriptionHelp}
                </p>
              )}
              <span className="tabular shrink-0 font-mono text-sm text-muted-foreground" data-testid="description-count">
                {t.descriptionCount(form.description.length)}
              </span>
            </div>
            {proposal && (
              <div className="mt-3 border border-lime-deep bg-card p-4" data-testid="description-proposal">
                <div className="flex items-center gap-1.5 font-bold">
                  <Sparkles className="h-4 w-4 text-lime-deep" aria-hidden="true" />
                  {t.writing.title}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{t.writing.basis}</p>
                <p className="mt-3 whitespace-pre-line text-base">{proposal.text}</p>
                <p className="tabular mt-2 font-mono text-sm text-muted-foreground">{t.descriptionCount(proposal.text.length)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, description: proposal.text.slice(0, DESCRIPTION_MAX) });
                      setProposal(null);
                      toast.success(t.writing.used);
                    }}
                    className="min-h-10 bg-primary px-4 font-bold text-primary-foreground hover:brightness-110"
                  >
                    {t.writing.use}
                  </button>
                  <button
                    type="button"
                    onClick={() => write.mutate()}
                    disabled={write.isPending}
                    className="min-h-10 border border-border px-4 font-semibold hover:bg-accent disabled:opacity-50"
                  >
                    {write.isPending ? t.writing.busy : t.writing.another}
                  </button>
                  <button type="button" onClick={() => setProposal(null)} className="min-h-10 px-4 font-semibold text-muted-foreground hover:bg-accent">
                    {t.writing.dismiss}
                  </button>
                </div>
              </div>
            )}
          </div>
          <fieldset>
            <legend className={labelClass}>{t.services}</legend>
            <div className="flex flex-wrap gap-1.5">
              {SERVICES.map(s => {
                const on = form.services.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleService(s)}
                    className={cn(
                      "flex h-10 items-center gap-1.5 px-3 font-semibold uppercase",
                      on ? "border border-foreground bg-foreground text-background" : "border border-border hover:bg-accent",
                    )}
                  >
                    {on && <Check className="h-4 w-4" />}
                    {fr.services[s]}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="l-shuttle" className={labelClass}>
                {t.shuttleMinutes}
              </label>
              <input id="l-shuttle" inputMode="numeric" value={form.shuttleMinutes} onChange={set("shuttleMinutes")} aria-invalid={!!fieldErrors.shuttleMinutes} className={cn(inputClass, "tabular font-mono")} />
              {err("shuttleMinutes")}
            </div>
            <div>
              <label htmlFor="l-km" className={labelClass}>
                {t.distanceKm}
              </label>
              <input id="l-km" inputMode="decimal" value={form.distanceKm} onChange={set("distanceKm")} aria-invalid={!!fieldErrors.distanceKm} className={cn(inputClass, "tabular font-mono")} />
              {err("distanceKm")}
            </div>
            <div>
              <label htmlFor="l-hours" className={labelClass}>
                {t.openingHours}
              </label>
              <input id="l-hours" value={form.openingHours} onChange={set("openingHours")} placeholder={t.openingHoursPlaceholder} className={inputClass} />
              {err("openingHours")}
            </div>
          </div>
          <fieldset>
            <legend className={labelClass}>{t.cancellation}</legend>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {POLICIES.map(p => {
                const on = form.cancellationPolicy === p;
                const [label, sub] = fr.cancellation[p];
                return (
                  <label key={p} className={cn("flex min-h-11 cursor-pointer items-center gap-2.5 border px-3", on ? "border-lime-deep" : "border-border")}>
                    <input type="radio" name="policy" checked={on} onChange={() => setForm({ ...form, cancellationPolicy: p })} className="h-4 w-4 accent-[hsl(var(--primary))]" />
                    <span>
                      <b>{label}</b> <span className="text-sm text-muted-foreground">{sub}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <fieldset>
            <legend className={labelClass}>{t.photos}</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {form.photos.map((url, i) => (
                <div key={url + i} className="relative h-[70px] bg-card">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    aria-label={t.removePhoto}
                    onClick={() => setForm({ ...form, photos: form.photos.filter((_, j) => j !== i) })}
                    className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center bg-background/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <label htmlFor="l-photo" className="sr-only">
                {t.photoUrl}
              </label>
              <input id="l-photo" type="url" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder={t.photoUrl} className={cn(inputClass, "text-base")} />
              <button type="button" onClick={addPhoto} className="h-11 shrink-0 border border-dashed border-muted-foreground px-4 font-semibold uppercase hover:bg-accent">
                {t.addPhoto}
              </button>
            </div>
            {err("photos") ?? <p className="mt-1 text-sm text-muted-foreground">{t.photosHelp}</p>}
          </fieldset>
        </form>

        <aside className="flex flex-col items-center gap-3">
          <span className={cn(labelClass, "self-start")}>{t.preview}</span>
          <ListingPreview
            title={form.title}
            photo={form.photos[0]}
            services={form.services}
            shuttleMinutes={form.shuttleMinutes ? Number(form.shuttleMinutes) : null}
            openingHours={form.openingHours}
            cancellationPolicy={form.cancellationPolicy}
            fromPriceCents={prices.length ? Math.min(...prices) : null}
          />
          <div className="mt-auto flex gap-2 self-stretch pt-4">
            {pageUrl ? (
              <a href={pageUrl} target="_blank" rel="noreferrer" className="flex h-[50px] flex-1 items-center justify-center border border-border font-semibold uppercase hover:bg-accent">
                {t.viewPage}
              </a>
            ) : (
              <span className="flex h-[50px] flex-1 items-center justify-center border border-border font-semibold uppercase text-muted-foreground opacity-50">{t.viewPage}</span>
            )}
            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={busy}
              className="h-[50px] flex-1 bg-primary text-lg font-bold uppercase tracking-wider text-primary-foreground hover:brightness-110 disabled:opacity-50"
            >
              {t.save}
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
