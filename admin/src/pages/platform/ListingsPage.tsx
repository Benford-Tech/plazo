import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ListingPreview } from "@/components/plazo/ListingPreview";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import { LISTING_TONE, shortDate } from "@/lib/platform";
import { euros } from "@/lib/pricing";
import type { ListingStatus, PlatformListing } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = fr.platform.listings;
// The traveller site shares the domain (served at /); VITE_SITE_URL points elsewhere in development.
const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "").replace(/\/$/, "");
const FILTERS: (ListingStatus | "all")[] = ["pending_review", "published", "rejected", "draft", "all"];

const labelClass = "text-[11px] uppercase tracking-[0.08em] text-muted-foreground";
const ghostButton = "min-h-10 whitespace-nowrap border border-border px-3 text-base hover:bg-accent disabled:opacity-50";
const primaryButton = "min-h-10 whitespace-nowrap bg-primary px-4 text-base font-bold uppercase tracking-wide text-primary-foreground hover:brightness-110 disabled:opacity-50";

/** The listing as the platform reviews it: the result card and everything the operator filled in. */
function ListingDetails({ listing }: { listing: PlatformListing }) {
  return (
    <div className="grid gap-5 border-t border-border pt-4 lg:grid-cols-[340px_1fr]">
      <div className="flex flex-col gap-2">
        <ListingPreview
          title={listing.title}
          photo={listing.photos[0]}
          services={listing.services}
          shuttleMinutes={listing.shuttleMinutes}
          openingHours={listing.openingHours ?? ""}
          cancellationPolicy={listing.cancellationPolicy}
          fromPriceCents={listing.fromPriceCents}
        />
        <p className="text-sm text-muted-foreground">{t.previewNote}</p>
      </div>
      <dl className="grid content-start gap-x-6 gap-y-3 sm:grid-cols-[10rem_1fr]">
        <dt className={labelClass}>{t.address}</dt>
        <dd>
          {listing.parking.name} · {t.places(listing.parking.effectiveCapacity ?? listing.parking.totalCapacity)}
          {listing.parking.address && <span className="block text-muted-foreground">{listing.parking.address}</span>}
        </dd>
        <dt className={labelClass}>{t.description}</dt>
        <dd className="whitespace-pre-line">{listing.description || "—"}</dd>
        <dt className={labelClass}>{fr.plazo.services}</dt>
        <dd>{listing.services.map(s => fr.services[s]).join(" · ") || "—"}</dd>
        <dt className={labelClass}>{fr.plazo.cancellation}</dt>
        <dd>{fr.cancellationShort[listing.cancellationPolicy]}</dd>
        <dt className={labelClass}>{t.prices}</dt>
        <dd className="font-mono">
          {listing.pricingTiers.length ? listing.pricingTiers.map(tier => <span key={tier.days} className="mr-4 inline-block">{t.upTo(tier.days, euros(tier.priceCents))}</span>) : t.noPrices}
        </dd>
        <dt className={labelClass}>{t.photos}</dt>
        <dd>
          {listing.photos.length ? (
            <div className="flex flex-wrap gap-2">
              {listing.photos.map(url => (
                <a key={url} href={url} target="_blank" rel="noreferrer">
                  <img src={url} alt="" className="h-16 w-24 object-cover" />
                </a>
              ))}
            </div>
          ) : (
            t.noPhoto
          )}
        </dd>
        {listing.reviewMessage && (
          <>
            <dt className={labelClass}>{t.lastMessage}</dt>
            <dd className="border-l-2 border-lime-deep pl-3">{listing.reviewMessage}</dd>
          </>
        )}
      </dl>
    </div>
  );
}

function MessageForm({
  label,
  placeholder,
  required,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
  id,
}: {
  label: string;
  placeholder?: string;
  required: boolean;
  submitLabel: string;
  pending: boolean;
  onSubmit: (message: string) => void;
  onCancel: () => void;
  id: string;
}) {
  const [message, setMessage] = useState("");
  return (
    <form
      className="flex flex-col gap-2 border-t border-border pt-3"
      onSubmit={e => {
        e.preventDefault();
        if (required && !message.trim()) return;
        onSubmit(message.trim());
      }}
    >
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        required={required}
        maxLength={1000}
        value={message}
        placeholder={placeholder}
        onChange={e => setMessage(e.target.value)}
        className="w-full border border-border bg-background px-3 py-2 text-base outline-none focus-visible:border-lime-deep"
      />
      <div className="flex gap-2">
        <button type="submit" disabled={pending || (required && !message.trim())} className={primaryButton}>
          {submitLabel}
        </button>
        <button type="button" onClick={onCancel} className={ghostButton}>
          {t.cancel}
        </button>
      </div>
    </form>
  );
}

function ListingRow({ listing, first }: { listing: PlatformListing; first: boolean }) {
  const queryClient = useQueryClient();
  // The oldest request is shown in full; the others open on demand.
  const [open, setOpen] = useState(first && listing.status === "pending_review");
  const [form, setForm] = useState<"reject" | "unpublish" | null>(null);
  const done = (message: string) => () => {
    toast.success(message);
    setForm(null);
    queryClient.invalidateQueries({ queryKey: ["platform"] });
  };
  const onError = (err: Error) => toast.error(describeError(err));
  const approve = useMutation({ mutationFn: () => adminApi.approveListing(listing.id), onSuccess: done(t.approved), onError });
  const reject = useMutation({ mutationFn: (message: string) => adminApi.rejectListing(listing.id, message), onSuccess: done(t.rejected), onError });
  const unpublish = useMutation({
    mutationFn: (message: string) => adminApi.unpublishListing(listing.id, message || undefined),
    onSuccess: done(t.unpublished),
    onError,
  });
  const date = listing.status === "pending_review" && listing.submittedAt ? t.submittedOn(shortDate.format(new Date(listing.submittedAt))) : t.updatedOn(shortDate.format(new Date(listing.updatedAt)));

  return (
    <li className="flex flex-col gap-3 border border-border p-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold">{listing.title}</p>
          <p className={labelClass}>
            {listing.operator.name} · {listing.airport.name} · {date}
            {listing.operator.status === "suspended" && <span className="ml-2 text-destructive">{t.operatorSuspended}</span>}
          </p>
        </div>
        <span className={cn("whitespace-nowrap", LISTING_TONE[listing.status])}>
          <span aria-hidden="true">● </span>
          {fr.listingStatus[listing.status]}
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className={ghostButton}>
            {open ? t.hideDetails : t.details}
          </button>
          {listing.status === "published" && (
            <a href={`${SITE_URL}/${listing.airport.slug}/${listing.slug}`} target="_blank" rel="noreferrer" className={cn(ghostButton, "flex items-center")}>
              {t.viewPage}
            </a>
          )}
          {listing.status === "pending_review" && (
            <>
              <button type="button" className={primaryButton} disabled={approve.isPending} onClick={() => approve.mutate()}>
                {t.approve}
              </button>
              <button type="button" className={ghostButton} onClick={() => setForm("reject")}>
                {t.reject}
              </button>
            </>
          )}
          {listing.status === "published" && (
            <button type="button" className={ghostButton} onClick={() => setForm("unpublish")}>
              {t.unpublish}
            </button>
          )}
        </div>
      </div>
      {form === "reject" && (
        <MessageForm
          id={`reject-${listing.id}`}
          label={t.rejectLabel}
          placeholder={t.rejectPlaceholder}
          required
          submitLabel={t.confirmReject}
          pending={reject.isPending}
          onSubmit={m => reject.mutate(m)}
          onCancel={() => setForm(null)}
        />
      )}
      {form === "unpublish" && (
        <MessageForm
          id={`unpublish-${listing.id}`}
          label={t.unpublishLabel}
          required={false}
          submitLabel={t.confirmUnpublish}
          pending={unpublish.isPending}
          onSubmit={m => unpublish.mutate(m)}
          onCancel={() => setForm(null)}
        />
      )}
      {open && <ListingDetails listing={listing} />}
    </li>
  );
}

/** "Annonces" tab: the review queue ("À valider" first) and every listing by status. */
export default function ListingsPage() {
  const [params, setParams] = useSearchParams();
  const filter = (FILTERS as string[]).includes(params.get("statut") ?? "") ? (params.get("statut") as ListingStatus | "all") : "pending_review";
  const listings = useQuery({
    queryKey: ["platform", "listings", filter],
    queryFn: () => adminApi.getPlatformListings(filter === "all" ? undefined : filter),
  });
  const counts = listings.data?.counts;
  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : null;

  return (
    <>
      <h1 className="text-[26px] font-bold uppercase tracking-[0.03em]">{t.title}</h1>
      <div role="group" aria-label={t.title} className="flex flex-wrap gap-1">
        {FILTERS.map(f => {
          const count = f === "all" ? total : counts?.[f];
          return (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setParams(f === "pending_review" ? {} : { statut: f })}
              className={cn("flex min-h-10 items-center gap-2 px-3 text-base", filter === f ? "bg-primary font-bold text-primary-foreground" : "border border-border hover:bg-accent")}
            >
              {t.filters[f]}
              {count !== undefined && count !== null && <span className="font-mono text-sm">{count}</span>}
            </button>
          );
        })}
      </div>
      {listings.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : listings.error ? (
        <p className="text-destructive">{describeError(listings.error)}</p>
      ) : listings.data?.listings.length ? (
        <ul className="flex flex-col gap-3">
          {listings.data.listings.map((l, i) => (
            <ListingRow key={l.id} listing={l} first={i === 0} />
          ))}
        </ul>
      ) : (
        <p className="py-6 text-muted-foreground">{t.empty}</p>
      )}
    </>
  );
}
