import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, MessageSquareText } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Badge, type BadgeTone } from "@/components/dashboard/Badge";
import { useQuickCard } from "@/components/reservations/ReservationQuickCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, adminApi } from "@/lib/api";
import { addDays, localParts, longDate, shortDay } from "@/lib/datetime";
import { describeError, errorMessage, fr, remindersFr as t } from "@/lib/fr";
import { renderTemplate, smsLength, toE164, toGsm7, unicodeCharacters, unknownVariables } from "@/lib/sms";
import type { ReminderBoard, ReminderEvening, ReminderRow, ReminderRowStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const CARD = "rounded-xl border border-panel-line bg-panel p-4 sm:p-5";
const BUTTON = "flex h-10 items-center justify-center rounded-lg border border-panel-line bg-panel px-3.5 text-sm font-medium hover:bg-panel-2 disabled:opacity-50";
const ACTION = "flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:brightness-105 disabled:opacity-50";
const SELECT = "h-10 rounded-lg border border-panel-line bg-panel px-2.5 font-mono text-[15px] font-semibold disabled:opacity-60";

const TONE: Record<ReminderRowStatus, BadgeTone> = {
  planned: "info",
  sent: "ok",
  waiting: "warn",
  failed: "bad",
  excluded: "line",
  disabled: "line",
  no_mobile: "warn",
  foreign: "warn",
  no_channel: "line",
  not_sent: "line",
  paused: "line",
  same_day: "line",
  too_late: "line",
};

/** Local "YYYY-MM-DDTHH:mm" of the parking now. */
function localNow(): string {
  const { date, time } = localParts(new Date().toISOString());
  return `${date}T${time}`;
}

/** Minutes between two local wall-clock times "YYYY-MM-DDTHH:mm". */
function minutesBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}:00Z`) - Date.parse(`${from}:00Z`)) / 60000);
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function statusText(row: ReminderRow): string {
  const time = row.at?.slice(11) ?? "";
  if (row.status === "planned") return t.status.planned(time);
  if (row.status === "sent") return t.status.sent(time);
  if (row.status === "excluded") return t.status.excluded(row.excludedBy);
  return t.status[row.status];
}

/** « SMS de la veille » (S-A + S-B, 06/10/2026): the usual rule, the week's evenings, tonight's list and the text. */
export default function RemindersPage() {
  const queryClient = useQueryClient();
  const parking = useQuery({ queryKey: ["parking"], queryFn: adminApi.getParking });
  const parkingId = parking.data?.id;
  const [evening, setEvening] = useState<string | undefined>(undefined);
  // The text being written; null while it is the saved one. The test sends it before it is saved.
  const [draft, setDraft] = useState<string | null>(null);
  const board = useQuery({
    queryKey: ["reminders", parkingId, evening ?? "tonight"],
    queryFn: () => adminApi.getReminders(parkingId!, evening),
    enabled: !!parkingId,
    refetchInterval: 60_000,
  });

  const apply = (next: ReminderBoard) => {
    queryClient.setQueryData(["reminders", parkingId, evening ?? "tonight"], next);
    void queryClient.invalidateQueries({ queryKey: ["reminders", parkingId] });
  };

  const error = parking.error ?? board.error;
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Header board={board.data} draft={draft} />
      {error ? (
        <p className="text-destructive">{describeError(error) || t.loadError}</p>
      ) : !board.data ? (
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : (
        <>
          <SettingsTiles board={board.data} onSaved={apply} />
          <Week board={board.data} selected={board.data.evening.date} onSelect={date => setEvening(date === board.data.today ? undefined : date)} />
          <EveningCard board={board.data} onSaved={apply} />
          <MessageSection board={board.data} draft={draft} setDraft={setDraft} onSaved={apply} />
        </>
      )}
    </div>
  );
}

function Header({ board, draft }: { board: ReminderBoard | undefined; draft: string | null }) {
  const [testing, setTesting] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/reservations" aria-label={t.back} className="flex h-11 w-11 items-center justify-center rounded-lg border border-panel-line bg-panel hover:bg-panel-2">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <MessageSquareText className="h-6 w-6 text-lime-deep" aria-hidden="true" />
              {t.title}
            </h1>
            <p className="text-sm text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>
        {board?.can.edit && (
          <button type="button" aria-expanded={testing} onClick={() => setTesting(v => !v)} className={BUTTON}>
            {t.test.open}
          </button>
        )}
      </div>
      {testing && board && <TestForm board={board} draft={draft} onDone={() => setTesting(false)} />}
    </div>
  );
}

function TestForm({ board, draft, onDone }: { board: ReminderBoard; draft: string | null; onDone: () => void }) {
  const [phone, setPhone] = useState("");
  const test = useMutation({
    mutationFn: () =>
      adminApi.testReminder(board.parkingId, { ...(phone.trim() ? { to: toE164(phone) } : {}), ...(draft?.trim() ? { template: draft } : {}) }),
    onSuccess: res => {
      toast.success(res.outcome === "sent" ? t.test.sent(res.to) : t.test.queued(res.to));
      onDone();
    },
    onError: (err: Error) => {
      if (err instanceof ApiError && err.fields?.to === "required") toast.error(t.test.required);
      else if (err instanceof ApiError && err.fields) toast.error(errorMessage(Object.values(err.fields)[0]));
      else toast.error(describeError(err));
    },
  });
  return (
    <form
      className={cn(CARD, "flex flex-wrap items-end gap-3")}
      onSubmit={e => {
        e.preventDefault();
        test.mutate();
      }}
    >
      <div className="flex min-w-[240px] flex-1 flex-col gap-1">
        <label htmlFor="reminder-test-phone" className="text-sm text-muted-foreground">
          {t.test.label}
        </label>
        <input
          id="reminder-test-phone"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder={t.test.placeholder}
          className="h-10 rounded-lg border border-panel-line bg-panel px-3 font-mono"
        />
      </div>
      <button type="submit" disabled={test.isPending} className={ACTION}>
        {t.test.send}
      </button>
    </form>
  );
}

function SettingsTiles({ board, onSaved }: { board: ReminderBoard; onSaved: (b: ReminderBoard) => void }) {
  const s = t.settings;
  const save = useMutation({
    mutationFn: (input: { enabled?: boolean; sendTime?: string }) => adminApi.updateReminders(board.parkingId, input),
    onSuccess: next => {
      onSaved(next);
      toast.success(s.saved);
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });
  const { enabled, sendTime } = board.settings;
  const mode = board.channel.mode;
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className={cn(CARD, "flex items-center justify-between gap-3")}>
        <div>
          <p className="text-sm text-muted-foreground">{s.enabled}</p>
          <p className="text-base font-semibold">{enabled ? s.on : s.off}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={s.enabled}
          disabled={!board.can.edit || save.isPending}
          onClick={() => save.mutate({ enabled: !enabled })}
          className={cn(
            "flex h-[30px] w-[52px] shrink-0 items-center rounded-full p-[3px] transition-colors disabled:opacity-60",
            enabled ? "justify-end bg-primary" : "justify-start bg-panel-line",
          )}
        >
          <span className={cn("h-6 w-6 rounded-full", enabled ? "bg-lime-ink" : "bg-panel")} />
        </button>
      </div>
      <div className={cn(CARD, "flex flex-col gap-1.5")}>
        <label htmlFor="reminder-usual-time" className="text-sm text-muted-foreground">
          {s.usualTime}
        </label>
        <select
          id="reminder-usual-time"
          value={sendTime}
          disabled={!board.can.edit || save.isPending}
          onChange={e => save.mutate({ sendTime: e.target.value })}
          className={SELECT}
        >
          {board.sendTimes.map(time => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
      </div>
      <div className={cn(CARD, "flex flex-col gap-1")}>
        <p className="text-sm text-muted-foreground">{s.from}</p>
        <p className="flex flex-wrap items-center gap-2 text-base font-semibold">
          {s.channel[mode]}
          {mode !== "none" ? <Badge tone="ok">{s.ok}</Badge> : <Badge tone="warn">Off</Badge>}
        </p>
        <p className="text-sm text-muted-foreground">{s.channelNote[mode]}</p>
        {mode === "none" && board.can.edit && (
          <Link to="/mon-compte" className="text-sm font-semibold text-lime-deep hover:underline">
            {s.chooseChannel}
          </Link>
        )}
      </div>
    </div>
  );
}

function Week({ board, selected, onSelect }: { board: ReminderBoard; selected: string; onSelect: (date: string) => void }) {
  const w = t.week;
  const now = localNow();
  return (
    <section aria-labelledby="reminder-week" className="space-y-2.5">
      <h2 id="reminder-week" className="text-lg font-semibold">
        {w.title}
      </h2>
      <div role="group" aria-label={w.title} className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
        {board.evenings.map(e => {
          const isSelected = e.date === selected;
          const day = capitalise(shortDay(e.date));
          const until = e.when === "tonight" && !e.paused ? minutesBetween(now, `${e.date}T${e.sendTime}`) : null;
          return (
            <button
              key={e.date}
              type="button"
              aria-pressed={isSelected}
              data-testid="reminder-evening"
              onClick={() => onSelect(e.date)}
              className={cn(
                "flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left",
                isSelected ? "border-2 border-primary bg-[#F3FBE6] p-[11px]" : e.paused ? "border-dashed border-panel-line bg-panel-2 text-muted-foreground" : "border-panel-line bg-panel hover:bg-panel-2",
              )}
            >
              <span className={cn("text-[13px]", isSelected ? "font-semibold text-lime-deep" : "text-muted-foreground")}>
                {e.when === "tonight" ? w.tonight(shortDay(e.date)) : day}
              </span>
              <span className="font-mono text-lg font-semibold">{e.paused ? "--:--" : e.sendTime}</span>
              <span className="text-[13px]">
                {e.paused ? w.paused : e.when === "past" ? w.sent(e.counts.sent) : w.planned(e.counts.planned + e.counts.sent + e.counts.waiting)}
              </span>
              {e.counts.failed > 0 && <Badge tone="bad">{w.failed(e.counts.failed)}</Badge>}
              {until !== null && until > 0 && e.counts.planned > 0 && <Badge tone="info">{w.in(until)}</Badge>}
              {e.timeChanged && !e.paused && <Badge tone="warn">{w.timeChanged}</Badge>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function EveningCard({ board, onSaved }: { board: ReminderBoard; onSaved: (b: ReminderBoard) => void }) {
  const ev = t.evening;
  const e: ReminderEvening & { rows: ReminderRow[] } = board.evening;
  const queryClient = useQueryClient();
  const quickCard = useQuickCard();
  const change = useMutation({
    mutationFn: (input: { sendTime?: string | null; paused?: boolean }) => adminApi.updateReminderEvening(board.parkingId, e.date, input),
    onSuccess: onSaved,
    onError: (err: Error) => toast.error(describeError(err)),
  });
  const sendNow = useMutation({
    mutationFn: () => adminApi.sendRemindersNow(board.parkingId, e.date),
    onSuccess: next => {
      onSaved(next);
      toast.success(ev.sentNow(next.evening.counts.sent + next.evening.counts.waiting - (e.counts.sent + e.counts.waiting)));
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });
  const exclude = useMutation({
    mutationFn: ({ id, excluded }: { id: string; excluded: boolean }) => adminApi.setReminderExcluded(id, excluded),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["reminders", board.parkingId] }),
    onError: (err: Error) => toast.error(describeError(err)),
  });
  const day = capitalise(longDate(e.date));
  const departuresDay = longDate(e.departuresDate).split(" ")[0].toLowerCase();
  const editable = board.can.edit && e.when !== "past";

  return (
    <section aria-labelledby="reminder-evening-title" className={cn(CARD, "space-y-4")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h2 id="reminder-evening-title" className="text-lg font-semibold">
            {ev.title(e.when, e.when === "tonight" ? longDate(e.date).toLowerCase() : day, e.counts.departures, departuresDay)}
          </h2>
          <div className="flex flex-wrap gap-2">
            {e.counts.planned > 0 && <Badge tone="info">{ev.planned(e.counts.planned, e.sendTime)}</Badge>}
            {e.counts.sent > 0 && <Badge tone="ok">{ev.sent(e.counts.sent)}</Badge>}
            {e.counts.waiting > 0 && <Badge tone="warn">{ev.waiting(e.counts.waiting)}</Badge>}
            {e.counts.failed > 0 && <Badge tone="bad">{ev.failed(e.counts.failed)}</Badge>}
            {e.counts.withoutSms > 0 && <Badge tone="line">{ev.withoutSms(e.counts.withoutSms)}</Badge>}
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {editable && (
            <>
              <div className="flex flex-col gap-1">
                <label htmlFor="reminder-evening-time" className="text-xs text-muted-foreground">
                  {ev.time}
                </label>
                <select
                  id="reminder-evening-time"
                  value={e.sendTime}
                  disabled={change.isPending}
                  onChange={event => change.mutate({ sendTime: event.target.value === board.settings.sendTime ? null : event.target.value })}
                  className={SELECT}
                >
                  {board.sendTimes.map(time => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" disabled={change.isPending} onClick={() => change.mutate({ paused: !e.paused })} className={BUTTON}>
                {e.paused ? ev.resume : ev.pause}
              </button>
            </>
          )}
          {board.can.manage && e.canSendNow && (
            <button type="button" data-testid="reminder-send-now" disabled={sendNow.isPending} onClick={() => sendNow.mutate()} className={ACTION}>
              {ev.sendNow}
            </button>
          )}
        </div>
      </div>
      {e.rows.length === 0 ? (
        <p className="py-4 text-muted-foreground">{ev.empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="px-2.5 py-2 font-semibold">{ev.columns.arrival}</th>
                <th scope="col" className="px-2.5 py-2 font-semibold">{ev.columns.customer}</th>
                <th scope="col" className="px-2.5 py-2 font-semibold">{ev.columns.phone}</th>
                <th scope="col" className="px-2.5 py-2 font-semibold">{ev.columns.channel}</th>
                <th scope="col" className="px-2.5 py-2 font-semibold">{ev.columns.sms}</th>
                <th scope="col" className="px-2.5 py-2 font-semibold"><span className="sr-only">{ev.columns.action}</span></th>
              </tr>
            </thead>
            <tbody>
              {e.rows.map(row => {
                const muted = row.status === "excluded";
                const canToggle = board.can.manage && !["sent", "waiting", "failed", "not_sent"].includes(row.status) && e.when !== "past";
                return (
                  <tr key={row.reservationId} data-testid="reminder-row" data-status={row.status} className={cn("border-t border-panel-line", muted && "bg-panel-2 text-muted-foreground")}>
                    <td className="px-2.5 py-2.5 font-mono font-semibold">{row.arrivalAt.slice(11)}</td>
                    <td className="px-2.5 py-2.5">
                      <button type="button" onClick={() => quickCard.open(row.reservationId)} className="text-left font-semibold hover:underline">
                        {row.customerName}
                      </button>
                    </td>
                    <td className="px-2.5 py-2.5 font-mono text-muted-foreground">{row.customerPhone}</td>
                    <td className="px-2.5 py-2.5 text-muted-foreground">{row.channelDetail || fr.channels[row.channel]}</td>
                    <td className="px-2.5 py-2.5">
                      <Badge tone={TONE[row.status]}>{statusText(row)}</Badge>
                    </td>
                    <td className="px-2.5 py-2.5 text-right">
                      {row.status === "no_mobile" || row.status === "foreign" ? (
                        <Link to={`/reservations/${row.reservationId}`} className={cn(BUTTON, "inline-flex h-9")}>
                          {ev.fixPhone}
                        </Link>
                      ) : canToggle ? (
                        <button
                          type="button"
                          disabled={exclude.isPending}
                          onClick={() => exclude.mutate({ id: row.reservationId, excluded: row.status !== "excluded" })}
                          className={cn(BUTTON, "ml-auto h-9")}
                        >
                          {row.status === "excluded" ? ev.include : ev.exclude}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="rounded-lg bg-panel-2 px-3 py-2.5 text-[13px] text-muted-foreground">{ev.late}</p>
    </section>
  );
}

function MessageSection({
  board,
  draft: typed,
  setDraft: setTyped,
  onSaved,
}: {
  board: ReminderBoard;
  draft: string | null;
  setDraft: (text: string | null) => void;
  onSaved: (b: ReminderBoard) => void;
}) {
  const m = t.message;
  const saved = board.settings.template;
  // Untouched, the text follows the saved one (another manager, a reset); typed, it stays.
  const draft = typed ?? saved;
  const setDraft = (text: string) => setTyped(text === saved ? null : text);
  const textarea = useRef<HTMLTextAreaElement>(null);

  const values = board.sample.values;
  const preview = useMemo(() => renderTemplate(draft, values), [draft, values]);
  const length = smsLength(preview);
  const unknown = unknownVariables(draft);
  const unicode = length.encoding === "unicode" ? unicodeCharacters(preview) : [];
  const gsm = toGsm7(draft);
  const gsmLength = smsLength(renderTemplate(gsm, values));
  const shortLength = smsLength(renderTemplate(board.defaults.short, values));
  const heavy = length.segments > 2;
  const dirty = draft.trim() !== saved.trim();

  const save = useMutation({
    mutationFn: (template: string | null) => adminApi.updateReminders(board.parkingId, { template }),
    onSuccess: next => {
      onSaved(next);
      setTyped(null);
      toast.success(m.saved);
    },
    onError: (err: Error) => toast.error(err instanceof ApiError && err.fields?.template ? errorMessage(err.fields.template) : describeError(err)),
  });

  const insert = (token: string) => {
    const el = textarea.current;
    if (!el) return setDraft(`${draft}${token}`);
    const start = el.selectionStart ?? draft.length;
    const end = el.selectionEnd ?? draft.length;
    const next = `${draft.slice(0, start)}${token}${draft.slice(end)}`;
    setDraft(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const [day, month, year] = values.date.split("/");
  const sendDay = capitalise(shortDay(addDays(`${year}-${month}-${day}`, -1)));
  return (
    <div className="flex flex-wrap gap-4">
      <section aria-labelledby="reminder-message" className={cn(CARD, "flex min-w-0 flex-[999_1_560px] flex-col gap-3")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="reminder-message" className="text-lg font-semibold">
            {m.title}
          </h2>
          <span className="text-[13px] text-muted-foreground">
            {board.settings.custom && board.settings.updatedAt
              ? m.updated(board.settings.updatedBy, new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(new Date(board.settings.updatedAt)))
              : m.plazoText}
          </span>
        </div>
        <label htmlFor="reminder-template" className="sr-only">
          {m.label}
        </label>
        <textarea
          id="reminder-template"
          ref={textarea}
          rows={14}
          value={draft}
          readOnly={!board.can.edit}
          onChange={e => setDraft(e.target.value)}
          className="w-full resize-y rounded-lg border border-panel-line bg-panel p-3 text-sm leading-relaxed"
        />
        {board.can.edit ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-muted-foreground">{m.insert}</span>
            {board.variables.map(variable => (
              <button
                key={variable}
                type="button"
                title={m.variableHint[variable]}
                onClick={() => insert(`{${variable}}`)}
                className="h-9 rounded-full border border-lime-deep bg-[#F3FBE6] px-3 font-mono text-[13px] font-semibold text-lime-deep hover:brightness-95"
              >
                {`{${variable}}`}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-muted-foreground">{m.readOnly}</p>
        )}
        {unknown.length > 0 && <p className="rounded-lg border border-bad bg-bad-soft px-3 py-2 text-sm text-bad-text">{m.unknown(unknown.join(", "))}</p>}
        {!board.linkAvailable && /\{\s*lien\s*\}/i.test(draft) && <p className="text-[13px] text-warn-text">{m.noLink}</p>}
        <div className={cn("space-y-2 rounded-xl border px-3.5 py-3", heavy || unicode.length ? "border-[#F5D08A] bg-[#FFFBEB]" : "border-panel-line bg-panel-2")}>
          <p className="flex flex-wrap items-baseline gap-2.5">
            <span data-testid="reminder-segments" className={cn("font-mono text-lg font-semibold", heavy ? "text-[#92400E]" : "text-lime-deep")}>
              {m.count(length.segments)}
            </span>
            <span className={cn("text-sm", heavy ? "text-[#92400E]" : "text-muted-foreground")}>{m.perClient(length.characters)}</span>
          </p>
          {unicode.length > 0 && <p className="text-[13px] text-[#78350F]">{m.unicode(unicode.slice(0, 8).join(" "))}</p>}
          {heavy && <p className="text-[13px] text-[#78350F]">{m.long}</p>}
          {heavy && <p className="text-[13px] text-[#78350F]">{m.noPhoto}</p>}
          {board.can.edit && (unicode.length > 0 || heavy) && (
            <div className="flex flex-wrap gap-2">
              {unicode.length > 0 && gsmLength.segments < length.segments && (
                <button type="button" onClick={() => setDraft(gsm)} className={cn(BUTTON, "border-[#92400E] font-semibold text-[#92400E]")}>
                  {m.toGsm7(gsmLength.segments)}
                </button>
              )}
              {heavy && shortLength.segments < length.segments && (
                <button type="button" onClick={() => setDraft(board.defaults.short)} className={cn(BUTTON, "border-[#92400E] font-semibold text-[#92400E]")}>
                  {m.short(shortLength.segments)}
                </button>
              )}
            </div>
          )}
        </div>
        {board.can.edit && (
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={!dirty || unknown.length > 0 || !draft.trim() || save.isPending} onClick={() => save.mutate(draft)} className={ACTION}>
              {m.save}
            </button>
            {dirty && (
              <button type="button" onClick={() => setTyped(null)} className={BUTTON}>
                {m.discard}
              </button>
            )}
            {board.settings.custom && (
              <button type="button" disabled={save.isPending} onClick={() => save.mutate(null)} className="h-10 px-2 text-sm text-muted-foreground underline-offset-4 hover:underline">
                {m.reset}
              </button>
            )}
          </div>
        )}
      </section>
      <aside aria-labelledby="reminder-preview" className={cn(CARD, "flex min-w-0 flex-[1_1_320px] flex-col gap-3")}>
        <h2 id="reminder-preview" className="text-lg font-semibold">
          {t.preview.title}
        </h2>
        <p className="text-[13px] text-muted-foreground">{t.preview.for(board.sample.customerName, values.date, values.heure)}</p>
        <div className="flex flex-col gap-2 rounded-2xl bg-panel-2 p-4">
          <span className="self-center text-xs text-muted-foreground">{t.preview.sentAt(sendDay, board.evening.sendTime)}</span>
          <div data-testid="reminder-preview" className="max-h-[480px] overflow-auto whitespace-pre-line break-words rounded-2xl rounded-bl-md border border-panel-line bg-panel px-3.5 py-3 text-sm leading-snug">
            {preview}
          </div>
        </div>
        <p className="text-[13px] text-muted-foreground">{t.preview.also}</p>
      </aside>
    </div>
  );
}
