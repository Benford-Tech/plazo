import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { adminApi, ApiError } from "@/lib/api";
import { nightsBetween, shortDay } from "@/lib/datetime";
import { describeError, errorMessage, fr } from "@/lib/fr";
import type { EmailImportResult, Reservation } from "@/lib/types";
import { cn } from "@/lib/utils";

const labelClass = "mb-1 block text-[13px] font-semibold uppercase tracking-wide text-muted-foreground";
const inputClass = "h-12 w-full border bg-card px-3 text-lg text-foreground outline-none focus-visible:border-lime-deep";

/** "2026-10-01T08:30" -> "jeu. 1 oct. · 08:30" */
function localLabel(local: string): string {
  const month = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" }).format(new Date(`${local.slice(0, 10)}T12:00:00Z`));
  return `${shortDay(local.slice(0, 10))} ${month} · ${local.slice(11, 16)}`;
}

const euros = (cents: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);

function Found({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid min-h-11 grid-cols-[24px_120px_1fr] items-center gap-2.5 border-b border-[#262625]">
      <Check className="h-[18px] w-[18px] text-lime-deep" strokeWidth={2.5} aria-label={fr.importEmail.found} />
      <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={mono ? "tabular font-mono text-lg font-bold" : "text-lg font-semibold"}>{value}</span>
    </div>
  );
}

type Completion = { customerName: string; customerPhone: string; plate: string; returnFlight: string; passengers: string };

/** Option 1 (01/10/2026): the pasted email on the left, what was read and what to complete on the right. */
export default function ImportEmailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const t = fr.importEmail;
  const [text, setText] = useState("");
  const [result, setResult] = useState<EmailImportResult | null>(null);
  const [completion, setCompletion] = useState<Completion>({ customerName: "", customerPhone: "", plate: "", returnFlight: "", passengers: "1" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [force, setForce] = useState(false);
  const [lastCreated, setLastCreated] = useState<Reservation | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const analyse = useMutation({
    mutationFn: (value: string) => adminApi.parseEmail(value),
    onSuccess: data => {
      setResult(data);
      setFieldErrors({});
      setForce(false);
      const p = data.parsed;
      setCompletion({
        customerName: p.customerName ?? "",
        customerPhone: p.customerPhone ?? "",
        plate: p.plate ?? "",
        returnFlight: p.returnFlight ?? "",
        passengers: String(p.passengers ?? 1),
      });
    },
    onError: () => setResult(null),
  });

  // Analyse as soon as something is pasted (debounced while typing).
  useEffect(() => {
    if (text.trim().length < 40) return;
    const handle = setTimeout(() => analyse.mutate(text), 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const create = useMutation({
    mutationFn: () => {
      const p = result!.parsed;
      return adminApi.createReservation({
        channel: "aggregator",
        channelDetail: p.provider,
        externalReference: p.externalReference,
        priceCents: p.priceCents,
        arrivalAt: p.arrivalAt!,
        returnAt: p.returnAt!,
        customerName: completion.customerName,
        customerPhone: completion.customerPhone,
        customerEmail: p.customerEmail ?? null,
        plate: completion.plate,
        returnFlight: completion.returnFlight.trim() || null,
        passengers: Number(completion.passengers),
        force: force || undefined,
      });
    },
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ["planning"] });
      setLastCreated(data);
      toast.success(t.created(data.reference));
      setText("");
      setResult(null);
      textareaRef.current?.focus();
    },
    onError: (err: Error) => {
      setFieldErrors(err instanceof ApiError ? (err.fields ?? {}) : {});
      if (!(err instanceof ApiError && err.code === "validation_failed")) toast.error(describeError(err));
      if (err instanceof ApiError && err.code === "overbooked") analyse.mutate(text);
    },
  });

  const parsed = result?.parsed;
  const missing = new Set(result?.missing ?? []);
  const datesFound = !!parsed?.arrivalAt && !!parsed?.returnAt;
  const fullNights = result?.capacity?.fullNights ?? [];
  const minFree = result?.capacity?.nights.length ? Math.min(...result.capacity.nights.map(n => n.free)) : null;
  const canCreate = !!result && datesFound && !result.duplicate && (fullNights.length === 0 || force) && !create.isPending;
  const set = (key: keyof Completion) => (e: React.ChangeEvent<HTMLInputElement>) => setCompletion({ ...completion, [key]: e.target.value });
  const todoBorder = (key: keyof Completion) => (missing.has(key as never) && !completion[key].trim() ? "border-lime-deep" : "border-border");
  const analyseError = analyse.error instanceof ApiError ? errorMessage(analyse.error.code) : analyse.error ? describeError(analyse.error) : null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 border-b-2 border-lime-deep pb-2.5">
        <h1 className="text-3xl font-bold uppercase tracking-wide">{t.title}</h1>
        <span className="ml-auto text-muted-foreground">{t.known}</span>
      </div>

      {lastCreated && (
        <p role="status" className="flex items-center gap-3 border border-border px-3 py-2">
          <Check className="h-5 w-5 text-lime-deep" />
          {t.created(lastCreated.reference)}
          <Link to={`/reservations/${lastCreated.id}`} className="ml-auto font-semibold uppercase text-lime-deep">
            {t.openCreated}
          </Link>
        </p>
      )}

      <div className="grid gap-7 lg:grid-cols-[minmax(0,500px)_1fr]">
        <section className="flex flex-col gap-2.5">
          <label htmlFor="mail" className={labelClass}>
            {t.pasteLabel}
          </label>
          <textarea
            id="mail"
            ref={textareaRef}
            autoFocus
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={t.pastePlaceholder}
            className="tabular min-h-[420px] resize-y border border-border bg-card p-3.5 font-mono text-sm leading-relaxed text-muted-foreground outline-none placeholder:text-muted-foreground/70 focus-visible:border-lime-deep"
          />
          <button
            onClick={() => analyse.mutate(text)}
            disabled={!text.trim() || analyse.isPending}
            className="h-[50px] border border-foreground text-lg font-bold uppercase tracking-wide hover:bg-accent disabled:opacity-40"
          >
            {analyse.isPending ? t.analysing : result ? t.analyseAgain : t.analyse}
          </button>
        </section>

        <section className="flex min-w-0 flex-col gap-3.5" aria-live="polite">
          {analyseError && (
            <p role="alert" className="border border-destructive px-3 py-2 text-destructive">
              {analyseError}
            </p>
          )}
          {!result && !analyseError && <p className="border border-dashed border-border px-4 py-10 text-center text-muted-foreground">{t.empty}</p>}

          {result && parsed && (
            <>
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="bg-foreground px-2.5 py-1 font-bold uppercase text-background">{parsed.provider}</span>
                {parsed.externalReference && <span className="tabular font-mono text-xl font-bold text-lime-deep">{parsed.externalReference}</span>}
                <span className="ml-auto text-muted-foreground">{t.nothingSaved}</span>
              </div>

              {result.duplicate && (
                <div role="alert" className="flex flex-wrap items-center gap-3 bg-primary p-3 font-bold text-primary-foreground">
                  {t.duplicate(result.duplicate.reference)}
                  <Link to={`/reservations/${result.duplicate.id}`} className="ml-auto underline underline-offset-4">
                    {t.openDuplicate}
                  </Link>
                </div>
              )}

              <div>
                {parsed.arrivalAt && <Found label={t.arrival} value={localLabel(parsed.arrivalAt)} />}
                {parsed.returnAt && <Found label={t.return} value={localLabel(parsed.returnAt)} />}
                {parsed.customerName && <Found label={t.customer} value={parsed.customerName} mono={false} />}
                {parsed.customerEmail && <Found label={t.email} value={parsed.customerEmail} mono={false} />}
                {parsed.priceCents !== undefined && <Found label={t.price} value={euros(parsed.priceCents)} />}
              </div>
              {!datesFound && <p className="border border-lime-deep px-3 py-2 text-lime-deep">{t.datesMissing}</p>}

              <div className="grid gap-3.5 sm:grid-cols-2">
                {!parsed.customerName && (
                  <div className="sm:col-span-2">
                    <label htmlFor="imp-name" className={labelClass}>
                      {t.customer}
                      <span className="text-lime-deep">{t.toComplete}</span>
                    </label>
                    <input id="imp-name" value={completion.customerName} onChange={set("customerName")} className={cn(inputClass, todoBorder("customerName"))} />
                    {fieldErrors.customerName && <p className="mt-1 text-sm text-destructive">{errorMessage(fieldErrors.customerName)}</p>}
                  </div>
                )}
                <div>
                  <label htmlFor="imp-phone" className={labelClass}>
                    {t.phone}
                    {missing.has("customerPhone") && <span className="text-lime-deep">{t.toComplete}</span>}
                  </label>
                  <input
                    id="imp-phone"
                    type="tel"
                    value={completion.customerPhone}
                    onChange={set("customerPhone")}
                    className={cn(inputClass, "tabular font-mono", todoBorder("customerPhone"))}
                  />
                  {fieldErrors.customerPhone && <p className="mt-1 text-sm text-destructive">{errorMessage(fieldErrors.customerPhone)}</p>}
                </div>
                <div>
                  <label htmlFor="imp-plate" className={labelClass}>
                    {t.plate}
                    {missing.has("plate") && <span className="text-lime-deep">{t.toComplete}</span>}
                  </label>
                  <div
                    className={cn(
                      "flex h-12 items-stretch overflow-hidden rounded-[4px] border-[1.5px] border-[#F3F3F0]",
                      missing.has("plate") && !completion.plate.trim() && "outline outline-2 outline-offset-2 outline-primary",
                    )}
                  >
                    <span aria-hidden="true" className="flex w-5 items-end justify-center bg-plate-band pb-1 text-xs font-bold text-white">
                      F
                    </span>
                    <input
                      id="imp-plate"
                      autoCapitalize="characters"
                      placeholder="AB-123-CD"
                      value={completion.plate}
                      onChange={set("plate")}
                      className="min-w-0 flex-1 bg-white px-3 text-xl font-bold uppercase tracking-wide text-[#0B0B0C] outline-none placeholder:text-[#9a9a95]"
                    />
                  </div>
                  {fieldErrors.plate && <p className="mt-1 text-sm text-destructive">{errorMessage(fieldErrors.plate)}</p>}
                </div>
                <div>
                  <label htmlFor="imp-flight" className={labelClass}>
                    {t.flight}
                  </label>
                  <input
                    id="imp-flight"
                    autoCapitalize="characters"
                    placeholder="TO 3627"
                    value={completion.returnFlight}
                    onChange={set("returnFlight")}
                    className={cn(inputClass, "tabular border-border font-mono uppercase")}
                  />
                  {fieldErrors.returnFlight && <p className="mt-1 text-sm text-destructive">{errorMessage(fieldErrors.returnFlight)}</p>}
                </div>
                <div>
                  <label htmlFor="imp-pax" className={labelClass}>
                    {t.passengers}
                  </label>
                  <input
                    id="imp-pax"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={9}
                    value={completion.passengers}
                    onChange={set("passengers")}
                    className={cn(inputClass, "tabular border-border font-mono")}
                  />
                  {fieldErrors.passengers && <p className="mt-1 text-sm text-destructive">{errorMessage(fieldErrors.passengers)}</p>}
                </div>
              </div>

              {datesFound &&
                (fullNights.length > 0 ? (
                  <div role="alert" className="space-y-2 bg-primary p-3 text-primary-foreground">
                    <p className="text-lg font-bold uppercase">{fr.reservation.full(fullNights.map(shortDay).join(", "))}</p>
                    <p className="font-semibold">{result.capacity?.canForce ? fr.reservation.fullHelp : fr.reservation.fullNoForce}</p>
                    {result.capacity?.canForce && (
                      <label className="flex min-h-11 items-center gap-3 font-bold">
                        <input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)} className="h-5 w-5 accent-black" />
                        {fr.reservation.force}
                      </label>
                    )}
                  </div>
                ) : (
                  minFree !== null && (
                    <p className="border border-border px-3 py-2.5 text-muted-foreground">
                      {t.nightsAvailable(nightsBetween(parsed.arrivalAt!.slice(0, 10), parsed.returnAt!.slice(0, 10)), minFree)}
                    </p>
                  )
                ))}

              <div className="mt-auto flex flex-wrap justify-end gap-2.5 border-t border-border pt-3.5">
                <button
                  onClick={() => navigate("/reservations/nouvelle", { state: { prefill: { ...parsed, ...cleanCompletion(completion) } } })}
                  disabled={!!result.duplicate}
                  className="h-[52px] border border-border px-5 font-semibold uppercase hover:bg-accent disabled:opacity-40"
                >
                  {t.openForm}
                </button>
                <button
                  onClick={() => create.mutate()}
                  disabled={!canCreate}
                  className="h-[52px] bg-primary px-7 text-lg font-bold uppercase tracking-wider text-primary-foreground hover:brightness-110 disabled:opacity-40"
                >
                  {t.create}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}

function cleanCompletion(c: Completion) {
  return {
    ...(c.customerName.trim() ? { customerName: c.customerName } : {}),
    ...(c.customerPhone.trim() ? { customerPhone: c.customerPhone } : {}),
    ...(c.plate.trim() ? { plate: c.plate } : {}),
    ...(c.returnFlight.trim() ? { returnFlight: c.returnFlight } : {}),
    passengers: Number(c.passengers) || 1,
  };
}
