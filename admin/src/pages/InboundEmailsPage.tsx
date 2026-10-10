import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Mail, RefreshCw } from "lucide-react";
import { Fragment, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Badge, type BadgeTone } from "@/components/dashboard/Badge";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import { dateTimeShort, localParts, timeOf, todayLocal } from "@/lib/datetime";
import { describeError, inboundFr as t } from "@/lib/fr";
import type { InboundEmail, InboundEmailList, InboundEmailStatus, InboundEmailView, InboundPageLookup, InboundReanalysis, ParsedBooking } from "@/lib/types";
import { cn } from "@/lib/utils";

const VIEWS: InboundEmailView[] = ["todo", "done", "archived"];
const TONE: Record<InboundEmailStatus, BadgeTone> = {
  imported: "ok",
  duplicate: "line",
  incomplete: "warn",
  unrecognised: "bad",
  dismissed: "line",
  handled: "ok",
  archived: "line",
  forwarding: "info",
};
/** Still waiting for a booking: « Compléter » / « Saisir » lead to the form. */
const TO_CHECK: InboundEmailStatus[] = ["incomplete", "unrecognised"];
/** T-A: « Marquer comme traité » applies to these; a mail attached to a booking (imported, duplicate) is done by itself. */
const HANDLEABLE: InboundEmailStatus[] = ["incomplete", "unrecognised", "dismissed"];
/** The parsed fields under « Ce que Plazo a compris », in reading order (the provider sits in the header). */
const FIELDS: (keyof ParsedBooking)[] = [
  "externalReference",
  "customerName",
  "customerPhone",
  "customerEmail",
  "plate",
  "arrivalAt",
  "returnAt",
  "departureFlight",
  "returnFlight",
  "passengers",
  "priceCents",
];
const MONO_FIELDS: (keyof ParsedBooking)[] = ["externalReference", "plate", "departureFlight", "returnFlight"];
const URL_RE = /https?:\/\/[^\s<>"']+/g;
const PRIMARY = "flex h-10 items-center rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground hover:brightness-110 disabled:opacity-60";
const OUTLINE = "flex h-10 items-center rounded-full border border-lime-deep px-4 text-sm font-semibold text-lime-deep hover:bg-accent disabled:opacity-60";
const QUIET = "flex h-10 items-center px-3 text-sm text-muted-foreground underline-offset-4 hover:underline disabled:opacity-60";
/** A link in the text of the pane (the mail's addresses, the Allopark page). */
const TEXT_LINK = "font-medium text-lime-deep underline underline-offset-4";

/** The tab a mail of this status sits in (a forwarding confirmation is never listed). */
const viewOf = (status: InboundEmailStatus): InboundEmailView => (TO_CHECK.includes(status) ? "todo" : status === "archived" ? "archived" : "done");

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const fieldLabel = (key: string) => cap(t.list.field[key] ?? key);

/** "2026-10-12T08:30" (local, as the server parsed it) → "12 oct. 08:30", with no timezone shift. */
function localDateTime(value: string): string {
  const [date, time] = value.split("T");
  if (!date || !time) return value;
  const day = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
  return `${day} ${time.slice(0, 5)}`;
}

const euros = (cents: number) => `${(cents / 100).toFixed(2).replace(".", ",")} €`;

function fieldValue(key: keyof ParsedBooking, parsed: ParsedBooking): string | null {
  const value = parsed[key];
  if (value === undefined || value === null || value === "") return null;
  if (key === "arrivalAt" || key === "returnAt") return localDateTime(String(value));
  if (key === "priceCents") return euros(Number(value));
  return String(value);
}

/** The one-line summary of a parsed mail: "Dupont · AB-123-CD · 12 oct. 08:30 · AL-123". */
function summaryOf(parsed: ParsedBooking | null): string | null {
  if (!parsed) return null;
  const line = [parsed.customerName, parsed.plate, parsed.arrivalAt ? localDateTime(parsed.arrivalAt) : null, parsed.externalReference].filter(Boolean).join(" · ");
  return line || null;
}

/** The toast of « Relancer l'analyse »: the booking it created or found, or what the mail still lacks. */
function reanalysedMessage({ outcome, email }: InboundReanalysis): string {
  const r = t.list.reanalysed;
  if (outcome === "imported") return r.imported(email.reservationReference);
  if (outcome === "duplicate") return r.duplicate;
  if (outcome === "unrecognised") return r.unrecognised;
  const labels = FIELDS.filter(key => email.missing.includes(key)).map(key => t.list.field[key] ?? key);
  if (labels.length > 0) return r.missing(labels);
  const refusals = email.missing.filter(key => key !== "confidence" && !FIELDS.includes(key as keyof ParsedBooking));
  if (refusals.length > 0) return r.refused(refusals.map(code => t.list.refusal(code)).join(" "));
  return email.missing.includes("confidence") ? r.unsure : r.incomplete;
}

/** When the mail came in: the hour if today, the short date otherwise. */
function receivedShort(iso: string): string {
  return localParts(iso).date === todayLocal() ? timeOf(iso) : dateTimeShort(iso);
}

/** A line of text with its addresses as links; trailing punctuation stays in the sentence. */
function linkify(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const match of line.matchAll(URL_RE)) {
    const start = match.index ?? 0;
    const trail = /[.,;:!?)\]]+$/.exec(match[0])?.[0] ?? "";
    const url = match[0].slice(0, match[0].length - trail.length);
    if (start > last) out.push(<Fragment key={`t${start}`}>{line.slice(last, start)}</Fragment>);
    out.push(
      <a key={`a${start}`} href={url} target="_blank" rel="noopener noreferrer" className={cn("break-all", TEXT_LINK)}>
        {url}
      </a>,
    );
    if (trail) out.push(<Fragment key={`p${start}`}>{trail}</Fragment>);
    last = start + match[0].length;
  }
  if (last < line.length) out.push(<Fragment key="end">{line.slice(last)}</Fragment>);
  return out;
}

/** The mail as it reads: a paragraph per blank line, a line per line, quoted lines muted. */
function MailBody({ text }: { text: string }) {
  const paragraphs = text.replace(/\r\n?/g, "\n").trim().split(/\n[ \t]*\n/);
  return (
    <div data-testid="inbound-body" className="space-y-3 text-[15px] leading-relaxed">
      {paragraphs.map((paragraph, i) => (
        <p key={i}>
          {paragraph.split("\n").map((line, j) => (
            <span key={j} className={cn("block", line.trimStart().startsWith(">") && "text-muted-foreground")}>
              {linkify(line)}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}

/** L-A: a mail Claude classed as something else than a booking gets its kind next to its state. */
function KindBadge({ reading }: { reading: InboundEmail["reading"] }) {
  if (!reading || reading.kind === "booking") return null;
  return (
    <span data-testid="inbound-kind" className="inline-flex">
      <Badge tone={reading.kind === "other" ? "info" : "warn"}>{t.list.reading.kind[reading.kind]}</Badge>
    </span>
  );
}

function Row({ email, selected, onSelect }: { email: InboundEmail; selected: boolean; onSelect: () => void }) {
  const l = t.list;
  const summary = summaryOf(email.parsed) ?? email.reading?.summary ?? null;
  return (
    <li data-testid="inbound-row" data-status={email.status} className="border-b border-panel-line last:border-b-0">
      <button
        type="button"
        aria-current={selected ? "true" : undefined}
        onClick={onSelect}
        className={cn("block w-full space-y-1 border-l-4 px-4 py-3 text-left hover:bg-panel-2", selected ? "border-l-primary bg-accent" : "border-l-transparent")}
      >
        <span className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate font-semibold">{email.fromName ?? email.fromAddress ?? l.unknownSender}</span>
          <span className="shrink-0 font-mono text-xs text-muted-foreground">{receivedShort(email.receivedAt)}</span>
        </span>
        <span className={cn("block truncate text-sm", !email.subject && "text-muted-foreground")}>{email.subject ?? l.noSubject}</span>
        <span className="flex items-center gap-2">
          <Badge tone={TONE[email.status]}>{l.status[email.status]}</Badge>
          <KindBadge reading={email.reading} />
          {summary && <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{summary}</span>}
        </span>
      </button>
    </li>
  );
}

/** L-A (08/10/2026): what Claude made of the mail: kind, source, confidence, one-sentence summary. */
function ReadingLine({ reading, missing }: { reading: NonNullable<InboundEmail["reading"]>; missing: string[] }) {
  const l = t.list.reading;
  const percent = Math.round(reading.confidence * 100);
  const head = [l.kind[reading.kind], reading.provider, l.confidence(percent)].filter(Boolean).join(" · ");
  const unsure = reading.kind === "booking" && missing.includes("confidence");
  return (
    <div data-testid="inbound-reading-line" className="space-y-0.5 text-sm">
      <p>
        <span className="text-muted-foreground">{l.title} : </span>
        <span className="font-semibold">{head}</span>
      </p>
      {reading.summary && <p className="text-muted-foreground">{reading.summary}</p>}
      {unsure && <p className="text-warn-text">{l.unsure}</p>}
      {reading.kind !== "booking" && <p className="text-muted-foreground">{l.notBooking}</p>}
    </div>
  );
}

/** Only Allopark's own https pages are offered as a link (the server sends no other). */
const ALLOPARK_PAGE = /^https:\/\/(?:www\.)?allopark\.com\//i;

/**
 * 10/10/2026 (« Prévent captcha »): what became of the Allopark booking page. Plazo never passes an anti-robot check:
 * for a failure, the staff open the page in their own browser, pass the check themselves, then « Compléter » the
 * booking or « Relancer l'analyse » later.
 */
function PageLookupLine({ lookup }: { lookup: InboundPageLookup }) {
  const l = t.list.alloparkPage;
  const failed = lookup.outcome !== "read";
  return (
    <p data-testid="inbound-allopark-line" className="text-sm">
      <span className="text-muted-foreground">{l.label} : </span>
      <span className={cn("font-semibold", failed && "text-warn-text")}>{l.outcome[lookup.outcome]}</span>
      {failed && lookup.url && ALLOPARK_PAGE.test(lookup.url) && (
        <>
          {" · "}
          <a data-testid="inbound-allopark-page" href={lookup.url} target="_blank" rel="noopener noreferrer" className={TEXT_LINK}>
            {l.open}
          </a>
        </>
      )}
    </p>
  );
}

/** « Ce que Plazo a compris »: the parsed fields, each missing one flagged. */
function Understood({ email }: { email: InboundEmail }) {
  const l = t.list;
  const known = FIELDS.flatMap(key => {
    const value = email.parsed ? fieldValue(key, email.parsed) : null;
    const missing = value === null && email.missing.includes(key);
    if (value === null && !missing) return [];
    return [[key as string, missing ? null : value] as const];
  });
  // Anything else the server flagged is an import refusal (a stay too long, a date it could not read…), not a field.
  const refusals = email.missing.filter(key => key !== "confidence" && !FIELDS.includes(key as keyof ParsedBooking));
  return (
    <section data-testid="inbound-understood" aria-labelledby="inbound-understood-title" className="mx-5 mb-4 rounded-[10px] border border-panel-line bg-panel-2 px-4 py-3">
      <h3 id="inbound-understood-title" className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
        {l.understood}
      </h3>
      {refusals.length > 0 && (
        <p data-testid="inbound-refused" className="mt-2 rounded-[8px] bg-warn-soft px-3 py-2 text-sm font-medium text-warn-text">
          {l.refused(refusals.map(code => l.refusal(code)).join(" "))}
        </p>
      )}
      <dl className="mt-2 grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[auto_minmax(0,1fr)]">
        {known.map(([key, value]) => (
          <Fragment key={key}>
            <dt className="text-muted-foreground">{fieldLabel(key)}</dt>
            <dd className={cn(MONO_FIELDS.includes(key as keyof ParsedBooking) && "font-mono")}>
              {value === null ? <Badge tone="warn">{l.missingBadge}</Badge> : value}
            </dd>
          </Fragment>
        ))}
      </dl>
    </section>
  );
}

function Reading({
  email,
  pending,
  reanalysing,
  onHandle,
  onArchive,
  onReanalyse,
  onBack,
  className,
}: {
  email: InboundEmail;
  /** A gesture or an analysis is on its way: every action of the pane waits. */
  pending: boolean;
  /** This very mail is being analysed again. */
  reanalysing: boolean;
  onHandle: () => void;
  onArchive: () => void;
  onReanalyse: () => void;
  onBack: () => void;
  className?: string;
}) {
  const l = t.list;
  const navigate = useNavigate();
  const waiting = TO_CHECK.includes(email.status);
  const understood = email.parsed !== null || email.missing.length > 0;
  const canHandle = HANDLEABLE.includes(email.status);
  const canArchive = email.status !== "forwarding" && email.status !== "archived";
  // The server reads the stored text again: not for a mail already attached to a booking, nor once the text is purged.
  const canReanalyse = !email.reservationId && email.textBody !== null && email.status !== "forwarding";
  return (
    <article data-testid="inbound-reading" aria-labelledby="inbound-subject" className={cn("rounded-[14px] border border-panel-line bg-panel", className)}>
      <button type="button" onClick={onBack} className="flex h-11 items-center gap-1 px-3 text-sm font-semibold text-lime-deep md:hidden">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        {l.backToList}
      </button>
      {/* 10/10/2026 (« mets les boutons d'action en haut du mail »): the gestures sit above the subject. */}
      {(waiting || email.reservationId || canReanalyse || canHandle || canArchive) && (
        <div role="toolbar" aria-label={l.actions} data-testid="inbound-actions" className="flex flex-wrap items-center gap-2 border-b border-panel-line px-5 py-3">
            {waiting && (
              <button
                type="button"
                data-testid="inbound-complete"
                disabled={pending}
                onClick={() => navigate("/reservations/nouvelle", { state: { prefill: email.parsed ?? { provider: email.provider ?? "" }, inboundId: email.id } })}
                className={PRIMARY}
              >
                {email.parsed ? l.complete : l.typeIt}
              </button>
            )}
            {email.reservationId && (
              <Link to={`/reservations/${email.reservationId}`} className={OUTLINE}>
                {l.openBooking(email.reservationReference ?? "")}
              </Link>
            )}
            {canReanalyse && (
              <button type="button" data-testid="inbound-reanalyse" disabled={pending} aria-busy={reanalysing} onClick={onReanalyse} className={cn(OUTLINE, "gap-2")}>
                <RefreshCw className={cn("h-4 w-4", reanalysing && "motion-safe:animate-spin")} aria-hidden="true" />
                {reanalysing ? l.reanalysing : l.reanalyse}
              </button>
            )}
            {canHandle && (
              <button type="button" data-testid="inbound-handle" disabled={pending} onClick={onHandle} className={waiting ? OUTLINE : PRIMARY}>
                {l.handle}
              </button>
            )}
            {canArchive && (
              <button type="button" data-testid="inbound-archive" disabled={pending} onClick={onArchive} className={QUIET}>
                {l.archive}
              </button>
            )}
        </div>
      )}
      <header className="space-y-2 border-b border-panel-line px-5 py-4">
        <div className="flex flex-wrap items-start gap-2">
          <h2 id="inbound-subject" className={cn("min-w-0 flex-1 text-xl font-bold leading-tight", !email.subject && "text-muted-foreground")}>
            {email.subject ?? l.noSubject}
          </h2>
          <Badge tone={TONE[email.status]}>{l.status[email.status]}</Badge>
        </div>
        <p className="break-all text-sm">
          <span className="text-muted-foreground">{l.from} : </span>
          {l.sender(email.fromName, email.fromAddress)}
        </p>
        <p className="text-sm">
          <span className="text-muted-foreground">{l.received} : </span>
          <span className="font-mono">{dateTimeShort(email.receivedAt)}</span>
        </p>
        {email.analysedAt && (
          <p data-testid="inbound-analysed" className="text-sm">
            <span className="text-muted-foreground">{l.analysedAgain} : </span>
            <span className="font-mono">{dateTimeShort(email.analysedAt)}</span>
          </p>
        )}
        {email.provider && (
          <p className="text-sm">
            <span className="text-muted-foreground">{l.recognised} : </span>
            <span className="font-semibold text-lime-deep">{email.provider}</span>
          </p>
        )}
        {email.pageLookup && <PageLookupLine lookup={email.pageLookup} />}
        {email.reading && <ReadingLine reading={email.reading} missing={email.missing} />}
      </header>
      <div className="px-5 py-4">{email.textBody ? <MailBody text={email.textBody} /> : <p className="text-sm text-muted-foreground">{l.textGone}</p>}</div>
      {understood && <Understood email={email} />}
    </article>
  );
}

/**
 * « Boîte de réception » (M-A, 08/10/2026): the forwarded emails in three tabs, a list beside a reading pane.
 * The selected mail lives in "?mail="; a wide screen opens the first one by itself, a phone shows the list first.
 */
export default function InboundEmailsPage() {
  const l = t.list;
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<InboundEmailView>("todo");
  const emails = useQuery({ queryKey: ["inbound-emails", view], queryFn: () => adminApi.getInboundEmails(view), refetchInterval: 60_000 });
  // While a tab loads, its neighbours' answer keeps the counts on screen.
  const counts =
    emails.data?.counts ??
    queryClient
      .getQueriesData<InboundEmailList>({ queryKey: ["inbound-emails"] })
      .map(([, data]) => data?.counts)
      .find(Boolean) ??
    null;
  const list = emails.data?.data ?? [];
  const wanted = params.get("mail");
  const found = wanted ? (list.find(e => e.id === wanted) ?? null) : null;
  const selected = found ?? list[0] ?? null;
  // The detail opens on the wanted mail only: one that left this tab (handled by a colleague, a stale link) is not
  // replaced by another; the stale id leaves the address once the tab has loaded.
  const detailOpen = found !== null;

  const select = (id: string | null, replace = false) =>
    setParams(
      prev => {
        const next = new URLSearchParams(prev);
        if (id) next.set("mail", id);
        else next.delete("mail");
        return next;
      },
      { replace },
    );
  const switchView = (next: InboundEmailView) => {
    setView(next);
    select(null, true);
  };
  // A gesture or an analysis (up to ~40 s) may end after the staff left the inbox: the selection then stays put,
  // since moving it would navigate back here.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (emails.data && wanted && !found) select(null, true);
    // `select` is stable enough: it only wraps setParams.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emails.data, wanted, found]);
  /** ARIA tabs: Left / Right (and Home / End) move between the tabs, only the current one sits in the Tab order. */
  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const i = VIEWS.indexOf(view);
    const next =
      event.key === "ArrowRight" ? VIEWS[(i + 1) % VIEWS.length]
      : event.key === "ArrowLeft" ? VIEWS[(i - 1 + VIEWS.length) % VIEWS.length]
      : event.key === "Home" ? VIEWS[0]
      : event.key === "End" ? VIEWS[VIEWS.length - 1]
      : null;
    if (!next) return;
    event.preventDefault();
    switchView(next);
    document.getElementById(`inbox-tab-${next}`)?.focus();
  };

  const act = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "handle" | "archive" }) => (action === "handle" ? adminApi.handleInboundEmail(id) : adminApi.archiveInboundEmail(id)),
    onSuccess: (_result, { id, action }) => {
      toast.success(action === "handle" ? l.handled : l.archived);
      // The mail leaves this tab (always when archived, when handled from « À traiter »): move on to its neighbour.
      if (mounted.current && (action === "archive" || view === "todo")) {
        const i = list.findIndex(e => e.id === id);
        const next = list[i + 1] ?? list[i - 1] ?? null;
        select(next?.id ?? null, true);
      }
      void queryClient.invalidateQueries({ queryKey: ["inbound-emails"] });
      void queryClient.invalidateQueries({ queryKey: ["inbound-settings"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });

  /** « Relancer l'analyse » (10/10/2026): up to ~40 s (the Allopark page, then Claude). */
  const reanalyse = useMutation({
    mutationFn: (id: string) => adminApi.reanalyseInboundEmail(id),
    onSuccess: (result, id) => {
      toast.success(reanalysedMessage(result));
      // A booking found moves the mail to « Traités »: from another tab, the selection moves on to its neighbour like
      // after a gesture; otherwise the mail stays open with what Plazo understood this time.
      const leaves = viewOf(result.email.status) !== view;
      queryClient.setQueryData<InboundEmailList>(["inbound-emails", view], old =>
        old && { ...old, data: leaves ? old.data.filter(e => e.id !== id) : old.data.map(e => (e.id === id ? result.email : e)) },
      );
      if (mounted.current && leaves && selected?.id === id) {
        const i = list.findIndex(e => e.id === id);
        const next = list[i + 1] ?? list[i - 1] ?? null;
        select(next?.id ?? null, true);
      }
      void queryClient.invalidateQueries({ queryKey: ["inbound-emails"] });
      void queryClient.invalidateQueries({ queryKey: ["inbound-settings"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (result.email.reservationId) {
        void queryClient.invalidateQueries({ queryKey: ["reservations"] });
        void queryClient.invalidateQueries({ queryKey: ["planning"] });
        void queryClient.invalidateQueries({ queryKey: ["revenue"] });
      }
    },
    onError: (err: Error) => {
      toast.error(describeError(err, l.errors));
      // The row may have changed meanwhile (attached by a colleague, its text purged).
      void queryClient.invalidateQueries({ queryKey: ["inbound-emails"] });
    },
  });
  const busy = act.isPending || reanalyse.isPending;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex items-center gap-3 border-b-2 border-lime-deep pb-3">
        <Link to="/reservations" aria-label={l.back} className="flex h-11 w-11 items-center justify-center border border-border hover:bg-accent">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold uppercase tracking-wide">
            <Mail className="h-6 w-6 text-lime-deep" aria-hidden="true" />
            {l.title}
          </h1>
          <p className="text-sm text-muted-foreground">{l.subtitle}</p>
        </div>
      </div>

      <div role="tablist" aria-label={l.title} className="flex flex-wrap items-center gap-2">
        {VIEWS.map(v => (
          <button
            key={v}
            type="button"
            role="tab"
            id={`inbox-tab-${v}`}
            aria-selected={view === v}
            aria-controls="inbox-panel"
            tabIndex={view === v ? 0 : -1}
            onKeyDown={onTabKey}
            onClick={() => switchView(v)}
            className={cn(
              "flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold",
              view === v ? "border-primary bg-primary text-primary-foreground" : "border-panel-line bg-panel text-muted-foreground hover:bg-panel-2",
            )}
          >
            {l.tabs[v]}
            {counts && <span className={cn("rounded-full px-1.5 font-mono text-[11px] leading-5", view === v ? "bg-lime-ink/10" : "bg-panel-2")}>{counts[v]}</span>}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="inbox-panel" aria-labelledby={`inbox-tab-${view}`}>
        {emails.isError ? (
          <p className="text-destructive">{describeError(emails.error) || l.loadError}</p>
        ) : !emails.data ? (
          <Skeleton className="h-64" />
        ) : list.length === 0 ? (
          <p className="rounded-[14px] border border-panel-line bg-panel px-4 py-10 text-center text-muted-foreground">{l.empty[view]}</p>
        ) : (
          <div className="md:grid md:grid-cols-[360px_minmax(0,1fr)] md:items-start md:gap-4">
            <ul role="list" aria-label={l.tabs[view]} className={cn("overflow-hidden rounded-[14px] border border-panel-line bg-panel", detailOpen ? "hidden md:block" : "block")}>
              {list.map(email => (
                <Row key={email.id} email={email} selected={email.id === selected?.id} onSelect={() => select(email.id)} />
              ))}
            </ul>
            {selected && (
              <Reading
                email={selected}
                pending={busy}
                reanalysing={reanalyse.isPending && reanalyse.variables === selected.id}
                onHandle={() => act.mutate({ id: selected.id, action: "handle" })}
                onArchive={() => act.mutate({ id: selected.id, action: "archive" })}
                onReanalyse={() => reanalyse.mutate(selected.id)}
                onBack={() => select(null)}
                className={detailOpen ? "block" : "hidden md:block"}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
