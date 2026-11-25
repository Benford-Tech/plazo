import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Copy, ExternalLink, Phone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi, ApiError } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import { PRODUCT } from "@/lib/product";
import {
  CALL_GROUPS,
  callQueue,
  defaultCallback,
  isFrenchPhone,
  telHref,
  type CallGroup,
  type CallQueueItem,
} from "@/lib/prospecting";
import { CALL_OUTCOMES, type CallOutcome, type Prospect } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * « A · File d'appels » (25/11/2026): who to call, one prospect at a time. The queue on the left (callbacks due today,
 * interested, demo opened, written to without an answer, never contacted), the prospect's sheet on the right: its number,
 * what Plazo already sent, what to say, then the call's result in one click, which moves on to the next. On a phone, the
 * sheet alone with « Ensuite ».
 */
const t = fr.platform.prospecting.calls;

const dayMonth = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
const dayTime = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const hourMinute = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
const day = (iso: string | null | undefined) => (iso ? dayMonth.format(new Date(iso)) : null);

const contactName = (p: Prospect) => [p.contactFirstName, p.contactLastName].filter(Boolean).join(" ");

function queueLine(item: CallQueueItem): string {
  const p = item.prospect;
  const parts: string[] = [];
  if (p.airportCode) parts.push(p.airportCode);
  if (item.group === "callback" && p.calls?.callbackAt) parts.push(t.callbackAt(hourMinute.format(new Date(p.calls.callbackAt))));
  else if (item.group === "demo") parts.push(t.demoOpened(p.demo?.opens ?? 0));
  else if (item.group === "new" && p.origin) parts.push(t.newParking);
  if (item.group !== "new") parts.push(t.mails(p.step));
  if (item.group !== "callback") parts.push(t.callsMade(p.calls?.count ?? 0));
  return parts.join(" · ");
}

const OUTCOME_TONE: Partial<Record<CallOutcome, string>> = {
  interested: "border-ok/30 bg-ok-soft text-ok-text hover:bg-ok-soft",
  not_interested: "border-bad/30 bg-bad-soft text-bad-text hover:bg-bad-soft",
};

type PhoneFilter = "all" | "fr" | "foreign";

export function CallsView({ prospects, loading, callerName }: { prospects: Prospect[]; loading: boolean; callerName: string | null }) {
  const queryClient = useQueryClient();
  const [phones, setPhones] = useState<PhoneFilter>("all");
  const [airport, setAirport] = useState("");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [callback, setCallback] = useState<string | null>(null);

  const whole = useMemo(() => callQueue(prospects), [prospects]);
  const airports = useMemo(
    () => [...new Set(whole.map((i) => i.prospect.airportCode).filter((c): c is string => !!c))].sort(),
    [whole],
  );
  const queue = useMemo(
    () =>
      whole.filter(
        ({ prospect: p }) =>
          (phones === "all" || isFrenchPhone(p.phone) === (phones === "fr")) && (!airport || p.airportCode === airport),
      ),
    [whole, phones, airport],
  );
  const index = Math.max(0, queue.findIndex((i) => i.prospect.id === currentId));
  const item: CallQueueItem | undefined = queue[index];
  const prospect = item?.prospect;

  // A new prospect on screen: its own note and no callback form.
  useEffect(() => {
    setNote("");
    setCallback(null);
  }, [prospect?.id]);

  const history = useQuery({
    queryKey: ["platform", "prospect-calls", prospect?.id],
    queryFn: () => adminApi.getProspectCalls(prospect!.id),
    enabled: !!prospect && (prospect.calls?.count ?? 0) > 0,
  });

  const log = useMutation({
    mutationFn: (input: { outcome: CallOutcome; callbackAt?: string }) =>
      adminApi.logProspectCall(prospect!.id, { outcome: input.outcome, note: note.trim() || null, callbackAt: input.callbackAt ?? null }),
    onSuccess: (_, input) => {
      toast.success(t.saved(prospect!.companyName, t.outcomes[input.outcome].replace("…", "")));
      // The next one of the queue as it stands; the prospect just called leaves it with the refreshed list.
      setCurrentId(queue[index + 1]?.prospect.id ?? queue[index - 1]?.prospect.id ?? null);
      void queryClient.invalidateQueries({ queryKey: ["platform", "prospect-calls"] });
      return queryClient.invalidateQueries({ queryKey: ["platform", "prospects"] });
    },
    onError: (err: Error) => {
      const field = err instanceof ApiError ? err.fields?.callbackAt : undefined;
      toast.error((field && t.errors[field as keyof typeof t.errors]) || describeError(err, t.errors));
    },
  });

  const filters = (
    <div className="flex flex-wrap gap-2">
      <select
        aria-label={t.phonesFilter}
        value={phones}
        onChange={(e) => setPhones(e.target.value as PhoneFilter)}
        className="h-10 rounded-[10px] border border-panel-line bg-white px-3 text-sm font-semibold"
      >
        <option value="all">{t.allPhones}</option>
        <option value="fr">{t.frenchPhones}</option>
        <option value="foreign">{t.foreignPhones}</option>
      </select>
      <select
        aria-label={t.airportFilter}
        value={airport}
        onChange={(e) => setAirport(e.target.value)}
        className="h-10 rounded-[10px] border border-panel-line bg-white px-3 text-sm font-semibold"
      >
        <option value="">{t.allAirports}</option>
        {airports.map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </select>
    </div>
  );

  if (loading) return <Skeleton className="h-64 w-full rounded-[14px]" />;
  if (!prospect || !item)
    return (
      <div className="flex flex-col gap-3" data-testid="calls-view">
        {filters}
        <div className="rounded-[14px] border border-panel-line bg-white p-6 text-center">
          <p className="font-semibold">{t.empty}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t.emptyHint}</p>
        </div>
      </div>
    );

  const who = callerName && callerName !== PRODUCT.name ? `${callerName} de ${PRODUCT.name}` : `l'équipe ${PRODUCT.name}`;
  const name = contactName(prospect);
  const calls = prospect.calls;
  const go = (delta: number) => setCurrentId(queue[index + delta]?.prospect.id ?? prospect.id);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prospect.phone ?? "");
      toast.success(t.copied);
    } catch {
      /* the number stays selectable on screen */
    }
  };
  const fact = (label: string, value: string) => (
    <div className="rounded-[10px] bg-panel-2 px-3 py-2">
      <span className="block text-[11.5px] text-muted-foreground">{label}</span>
      <b className="text-[13.5px]">{value}</b>
    </div>
  );
  const upcoming = queue[index + 1];

  return (
    <div className="flex flex-col gap-3" data-testid="calls-view">
      {filters}
      <div className="grid gap-3 md:grid-cols-[300px_minmax(0,1fr)]">
        <nav aria-label={t.queue} className="hidden max-h-[75vh] flex-col gap-1 overflow-y-auto rounded-[14px] border border-panel-line bg-white p-2.5 md:flex">
          {CALL_GROUPS.map((group: CallGroup) => {
            const rows = queue.filter((i) => i.group === group);
            if (!rows.length) return null;
            return (
              <div key={group} className="flex flex-col gap-1">
                <h3 className="px-1 pt-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t.groups[group]} · {rows.length}
                </h3>
                {rows.map((row) => {
                  const on = row.prospect.id === prospect.id;
                  return (
                    <button
                      key={row.prospect.id}
                      type="button"
                      aria-current={on ? "true" : undefined}
                      onClick={() => setCurrentId(row.prospect.id)}
                      data-testid={`call-queue-${row.prospect.id}`}
                      className={cn(
                        "flex flex-col rounded-[10px] border px-2.5 py-2 text-left",
                        on ? "border-lime-deep bg-lime/15" : "border-transparent hover:bg-panel-2",
                      )}
                    >
                      <b className="text-sm">{row.prospect.companyName}</b>
                      <small className="text-xs text-muted-foreground">{queueLine(row)}</small>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <section aria-label={prospect.companyName} className="flex min-w-0 flex-col gap-3.5 rounded-[14px] border border-panel-line bg-white p-4 md:p-5" data-testid="call-sheet">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold leading-tight">{prospect.companyName}</h2>
              <p className="text-sm text-muted-foreground">
                {[prospect.town, prospect.airportCode, name ? t.contact(name) : null].filter(Boolean).join(" · ")}
              </p>
              <p className="mt-1 text-xs font-semibold text-lime-deep">{t.groups[item.group]}</p>
            </div>
            <span className="shrink-0 rounded-full bg-info-soft px-2.5 py-1 font-mono text-xs font-semibold text-info-text">
              {t.position(index + 1, queue.length)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 select-all font-mono text-2xl font-bold text-lime-deep" data-testid="call-number">
              {prospect.phone}
            </span>
            <a
              href={telHref(prospect.phone ?? "")}
              className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-lime px-4 text-sm font-bold text-lime-ink"
            >
              <Phone className="h-4 w-4" aria-hidden />
              {t.call}
            </a>
            <Button type="button" variant="outline" className="h-11 gap-2" onClick={copy}>
              <Copy className="h-4 w-4" aria-hidden />
              {t.copy}
            </Button>
            {prospect.website && (
              <a
                href={prospect.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-panel-line px-3 text-sm font-semibold"
              >
                {t.site}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {fact(t.facts.mails, t.facts.mailsValue(prospect.step, day(prospect.lastContactedAt)))}
            {fact(
              t.facts.demo,
              !prospect.demo
                ? t.facts.demoNone
                : prospect.demo.opens > 0
                  ? t.facts.demoValue(prospect.demo.opens, day(prospect.demo.lastOpenedAt))
                  : t.facts.demoNever,
            )}
            {fact(t.facts.tool, prospect.tool || t.facts.toolNone)}
            {fact(
              t.facts.calls,
              calls && calls.count > 0 && calls.lastOutcome && calls.lastAt
                ? t.facts.callsValue(calls.count, t.outcomes[calls.lastOutcome].replace("…", "").toLowerCase(), day(calls.lastAt) ?? "")
                : t.facts.callsNone,
            )}
          </div>

          {(prospect.statusNote || prospect.notes) && (
            <p className="text-sm text-muted-foreground">
              <b className="text-foreground">{t.notes} : </b>
              {[prospect.statusNote, prospect.notes].filter(Boolean).join(" · ")}
            </p>
          )}

          <p className="rounded-[8px] border-l-[3px] border-lime bg-panel-2 px-3 py-2.5 text-[13.5px]" data-testid="call-script">
            <b>{t.scriptTitle} · </b>
            {t.scripts[item.group](who)}
          </p>

          <div className="flex flex-col gap-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t.outcomeTitle}</h3>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
              {CALL_OUTCOMES.map((outcome) => (
                <Button
                  key={outcome}
                  type="button"
                  variant="outline"
                  disabled={log.isPending}
                  aria-expanded={outcome === "callback" ? callback !== null : undefined}
                  data-testid={`call-outcome-${outcome}`}
                  className={cn("h-11 font-semibold", OUTCOME_TONE[outcome])}
                  onClick={() => (outcome === "callback" ? setCallback(callback === null ? defaultCallback() : null) : log.mutate({ outcome }))}
                >
                  {t.outcomes[outcome]}
                </Button>
              ))}
            </div>
            {callback !== null && (
              <div className="flex flex-wrap items-end gap-2 rounded-[10px] bg-panel-2 p-3">
                <label className="flex flex-col gap-1 text-xs font-semibold">
                  {t.callbackLabel}
                  <input
                    type="datetime-local"
                    value={callback}
                    onChange={(e) => setCallback(e.target.value)}
                    data-testid="call-callback-at"
                    className="h-11 rounded-[10px] border border-panel-line bg-white px-3 text-sm"
                  />
                </label>
                <Button
                  type="button"
                  disabled={log.isPending || !callback}
                  className="h-11 bg-lime font-bold text-lime-ink hover:bg-lime"
                  onClick={() => {
                    const at = new Date(callback);
                    if (Number.isNaN(at.getTime())) return toast.error(t.errors.required);
                    log.mutate({ outcome: "callback", callbackAt: at.toISOString() });
                  }}
                >
                  {t.callbackSave}
                </Button>
                <Button type="button" variant="outline" className="h-11" onClick={() => setCallback(null)}>
                  {t.callbackCancel}
                </Button>
              </div>
            )}
            <input
              type="text"
              value={note}
              maxLength={300}
              onChange={(e) => setNote(e.target.value)}
              aria-label={t.noteLabel}
              placeholder={t.notePlaceholder}
              className="h-11 rounded-[10px] border border-dashed border-panel-line bg-white px-3 text-sm"
            />
          </div>

          {history.data && history.data.data.length > 0 && (
            <div className="flex flex-col gap-1 text-sm">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t.history}</h3>
              <ul className="flex flex-col gap-1">
                {history.data.data.slice(0, 5).map((c) => (
                  <li key={c.id} className="text-muted-foreground">
                    {t.historyLine(dayTime.format(new Date(c.at)), t.outcomes[c.outcome].replace("…", ""), c.by)}
                    {c.callbackAt ? ` · ${t.historyCallback(dayTime.format(new Date(c.callbackAt)))}` : ""}
                    {c.note ? ` · « ${c.note} »` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <Button type="button" variant="outline" className="h-11 gap-1" disabled={index === 0} onClick={() => go(-1)}>
              <ChevronLeft className="h-4 w-4" aria-hidden />
              {t.previous}
            </Button>
            <span className="hidden text-center text-xs text-muted-foreground sm:block">{t.hint}</span>
            <Button type="button" variant="outline" className="h-11 gap-1" disabled={!upcoming} onClick={() => go(1)}>
              {t.skip}
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
          {upcoming && (
            <p className="rounded-[10px] bg-panel-2 px-3 py-2 text-sm md:hidden">
              <span className="text-muted-foreground">{t.next} : </span>
              <b>{upcoming.prospect.companyName}</b>
              {upcoming.prospect.airportCode ? ` · ${upcoming.prospect.airportCode}` : ""}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
