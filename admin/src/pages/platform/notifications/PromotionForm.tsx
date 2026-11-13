import { useMutation, useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-context";
import { Label } from "@/components/ui/label";
import { adminApi, ApiError } from "@/lib/api";
import { dateTimeShort } from "@/lib/datetime";
import { describeError, fr } from "@/lib/fr";
import { PRODUCT } from "@/lib/product";
import { promotionLinkSummary } from "@/lib/promotion";
import type { PlatformNotification, PromotionFilters, PromotionLink } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = fr.platform.notifications;
const p = t.promo;
const TITLE_MAX = 50;
const BODY_MAX = 160;
const DEFAULT_AIRPORT = "lyon-saint-exupery";
const selectClass = "flex h-11 w-full rounded-lg border border-input bg-background px-3 text-base";
const inputClass = "flex h-11 w-full rounded-lg border border-input bg-background px-3 text-base";

type Opens = "home" | "search" | "parking";

const fieldError = (code: string | undefined) => (code ? (p.fieldErrors[code] ?? fr.errors[code] ?? p.fieldErrors.invalid) : undefined);

/** A toggle pill of « Qui la reçoit »: citron when on. */
function Pill({
  on,
  onClick,
  children,
  disabled,
  testId,
}: {
  on: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  testId?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      data-testid={testId}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium",
        on ? "border-lime bg-lime text-lime-ink" : "border-input bg-background text-foreground hover:border-lime-deep",
        disabled && "cursor-default",
      )}
    >
      {on && <Check className="size-4" aria-hidden />}
      {children}
    </button>
  );
}

/**
 * « Promotion » kind of the platform's notifications (13/11/2026, direction A « Message promo »): a push to the Plazo
 * app's phones that accepted « Offres et bons plans », optionally only those that booked at an airport or have nothing
 * to come, opening the app's home, a search or a parking's page. Two a week at most (429 weekly_limit).
 */
export default function PromotionForm({ onSent }: { onSent: (row: PlatformNotification) => void }) {
  const confirm = useConfirm();
  const [byAirport, setByAirport] = useState(false);
  const [filterAirport, setFilterAirport] = useState(DEFAULT_AIRPORT);
  const [noUpcoming, setNoUpcoming] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [opens, setOpens] = useState<Opens>("home");
  const [linkAirport, setLinkAirport] = useState(DEFAULT_AIRPORT);
  const [parking, setParking] = useState("");
  const [arrival, setArrival] = useState("");
  const [ret, setRet] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const airports = useQuery({
    queryKey: ["airports"],
    queryFn: adminApi.getAirports,
    staleTime: Infinity,
  });
  const airportOptions = airports.data?.length
    ? airports.data
    : [
        {
          code: "LYS",
          name: "Lyon Saint-Exupéry",
          city: "Lyon",
          slug: DEFAULT_AIRPORT,
        },
      ];
  const filters: PromotionFilters = {
    airport: byAirport ? filterAirport : null,
    noUpcoming,
  };
  const reach = useQuery({
    queryKey: ["platform", "notifications", "audience", "promotion", filters.airport, noUpcoming],
    queryFn: () => adminApi.getPlatformNotificationAudience("promotion", null, filters),
  });

  const dates = arrival && ret ? { arrival, return: ret } : {};
  const link: PromotionLink | null =
    opens === "home"
      ? null
      : opens === "parking"
        ? {
            kind: "parking",
            airport: linkAirport,
            parking: parking.trim(),
            ...dates,
          }
        : { kind: "search", airport: linkAirport, ...dates };

  const devices = reach.data?.devices ?? 0;
  const nextAt = reach.data?.nextPromotionAt ?? null;
  const datesHalf = !!arrival !== !!ret;
  const ready =
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    reach.isSuccess &&
    devices > 0 &&
    !nextAt &&
    !datesHalf &&
    (opens !== "parking" || parking.trim().length > 0);

  const send = useMutation({
    mutationFn: () =>
      adminApi.sendPlatformNotification({
        audience: "promotion",
        title: title.trim(),
        body: body.trim(),
        link,
        filters,
      }),
    onSuccess: ({ data }) => {
      setFieldErrors({});
      setTitle("");
      setBody("");
      onSent(data);
      void reach.refetch();
      toast.success(p.sent(data.recipients));
    },
    onError: (err: Error) => {
      setFieldErrors(err instanceof ApiError ? (err.fields ?? {}) : {});
      if (err instanceof ApiError && err.code === "weekly_limit") {
        const next = (err.details as { nextAt?: string } | undefined)?.nextAt;
        toast.error(p.weeklyLimit(next ? dateTimeShort(next) : null));
        void reach.refetch();
        return;
      }
      toast.error(describeError(err));
    },
  });

  const submit = async () => {
    if (!ready || send.isPending) return;
    if (
      await confirm(p.confirm(devices), {
        title: p.confirmTitle,
        confirmLabel: p.confirmYes,
      })
    )
      send.mutate();
  };

  return (
    <div className="grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <form
        className="space-y-5 rounded-[14px] border border-border bg-card p-5"
        aria-label={p.send}
        onSubmit={e => {
          e.preventDefault();
          void submit();
        }}
      >
        <p className="text-sm text-muted-foreground">{p.intro}</p>
        {reach.data && !reach.data.configured && <p className="rounded-lg border border-destructive/40 p-3 text-destructive">{t.notConfigured}</p>}

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{p.who}</legend>
          <div className="flex flex-wrap gap-2">
            <Pill on disabled testId="promo-accepted">
              {p.accepted}
            </Pill>
            <Pill on={byAirport} onClick={() => setByAirport(v => !v)} testId="promo-by-airport">
              {p.bookedAt(airportOptions.find(a => a.slug === filterAirport)?.city ?? filterAirport)}
            </Pill>
            <Pill on={noUpcoming} onClick={() => setNoUpcoming(v => !v)} testId="promo-no-upcoming">
              {p.noUpcoming}
            </Pill>
          </div>
          {byAirport && (
            <div className="max-w-xs space-y-1.5">
              <Label htmlFor="promo-filter-airport">{p.bookedAtAirport}</Label>
              <select
                id="promo-filter-airport"
                className={selectClass}
                value={filterAirport}
                onChange={e => setFilterAirport(e.target.value)}
                aria-invalid={!!fieldErrors["filters.airport"]}
              >
                {airportOptions.map(a => (
                  <option key={a.slug} value={a.slug}>
                    {a.name}
                  </option>
                ))}
              </select>
              {fieldErrors["filters.airport"] && <p className="text-sm text-destructive">{fieldError(fieldErrors["filters.airport"])}</p>}
            </div>
          )}
        </fieldset>

        <FormField
          id="promo-title"
          label={t.titleField}
          placeholder="ex. −15 % pour Noël"
          maxLength={TITLE_MAX}
          required
          value={title}
          onChange={e => setTitle(e.target.value)}
          error={fieldErrors.title}
          help={t.charsLeft(TITLE_MAX - title.length)}
        />
        <div className="space-y-1.5">
          <Label htmlFor="promo-body">{t.body}</Label>
          <textarea
            id="promo-body"
            className="flex min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-base"
            maxLength={BODY_MAX}
            required
            value={body}
            aria-invalid={!!fieldErrors.body}
            onChange={e => setBody(e.target.value)}
          />
          <p className={cn("text-xs", fieldErrors.body ? "text-destructive" : "text-muted-foreground")}>
            {fieldErrors.body ? fieldError(fieldErrors.body) : t.charsLeft(BODY_MAX - body.length)}
          </p>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">{p.opens}</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2" role="radiogroup">
            {(
              [
                ["home", p.openHome],
                ["search", p.openSearch],
                ["parking", p.openParking],
              ] as [Opens, string][]
            ).map(([value, label]) => (
              <label key={value} className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-base">
                <input
                  type="radio"
                  name="promo-opens"
                  value={value}
                  checked={opens === value}
                  onChange={() => setOpens(value)}
                  className="size-4 accent-[#1E5E2E]"
                />
                {label}
              </label>
            ))}
          </div>
          {opens !== "home" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="promo-link-airport">{p.airport}</Label>
                <select
                  id="promo-link-airport"
                  className={selectClass}
                  value={linkAirport}
                  onChange={e => setLinkAirport(e.target.value)}
                  aria-invalid={!!fieldErrors["link.airport"]}
                >
                  {airportOptions.map(a => (
                    <option key={a.slug} value={a.slug}>
                      {a.name}
                    </option>
                  ))}
                </select>
                {fieldErrors["link.airport"] && <p className="text-sm text-destructive">{fieldError(fieldErrors["link.airport"])}</p>}
              </div>
              {opens === "parking" && (
                <div className="space-y-1.5">
                  <Label htmlFor="promo-parking">{p.parking}</Label>
                  <input
                    id="promo-parking"
                    className={inputClass}
                    placeholder={p.parkingPlaceholder}
                    maxLength={80}
                    value={parking}
                    onChange={e => setParking(e.target.value)}
                    aria-invalid={!!fieldErrors["link.parking"]}
                  />
                  <p className={cn("text-xs", fieldErrors["link.parking"] ? "text-destructive" : "text-muted-foreground")}>
                    {fieldErrors["link.parking"] ? fieldError(fieldErrors["link.parking"]) : p.parkingHelp}
                  </p>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="promo-arrival">{p.arrival}</Label>
                <input
                  id="promo-arrival"
                  type="datetime-local"
                  className={inputClass}
                  value={arrival}
                  onChange={e => setArrival(e.target.value)}
                  aria-invalid={!!fieldErrors["link.arrival"]}
                />
                {fieldErrors["link.arrival"] && <p className="text-sm text-destructive">{fieldError(fieldErrors["link.arrival"])}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="promo-return">{p.return}</Label>
                <input
                  id="promo-return"
                  type="datetime-local"
                  className={inputClass}
                  value={ret}
                  onChange={e => setRet(e.target.value)}
                  aria-invalid={!!fieldErrors["link.return"]}
                />
                {fieldErrors["link.return"] && <p className="text-sm text-destructive">{fieldError(fieldErrors["link.return"])}</p>}
              </div>
              <p className={cn("text-xs sm:col-span-2", datesHalf ? "text-destructive" : "text-muted-foreground")}>
                {datesHalf ? p.fieldErrors.required : p.datesHelp}
              </p>
            </div>
          )}
          <p className="text-sm text-lime-deep" data-testid="promo-link-summary">
            {promotionLinkSummary(link, airports.data)}
          </p>
        </fieldset>

        <div className="space-y-2 border-t border-border pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-base font-semibold" aria-live="polite">
              {reach.isFetching ? t.counting : reach.isSuccess ? p.reach(devices) : ""}
            </p>
            <Button type="submit" className="h-11" disabled={!ready || send.isPending}>
              {p.send}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{p.note}</p>
          {nextAt && <p className="text-sm font-medium text-warn">{p.nextAt(dateTimeShort(nextAt))}</p>}
        </div>
      </form>

      <aside aria-label={p.preview} className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{p.preview}</p>
        <div className="mx-auto w-[260px] rounded-[36px] border-[6px] border-[#1A1D1A] bg-gradient-to-b from-[#2C1A0E] to-[#4a2e18] p-3 pt-10 shadow-sm">
          <div className="rounded-2xl bg-white/90 p-3 text-[#1A1D1A] backdrop-blur" data-testid="promo-preview">
            <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
              <span className="grid size-5 place-items-center rounded-md bg-[#FF6600] text-[10px] font-extrabold text-white">P</span>
              <span className="font-semibold uppercase tracking-wide">{PRODUCT.name}</span>
              <span className="ml-auto">{p.previewNow}</span>
            </div>
            <p className="mt-1.5 text-sm font-semibold">{title.trim() || t.titleField}</p>
            <p className="text-sm leading-snug">{body.trim() || t.body}</p>
          </div>
          <div className="h-56" />
        </div>
      </aside>
    </div>
  );
}
