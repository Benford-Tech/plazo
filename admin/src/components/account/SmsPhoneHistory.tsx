import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { shortDay } from "@/lib/datetime";
import { describeError, fr } from "@/lib/fr";
import type { PhoneHistory, PhoneState } from "@/lib/types";
import { cn } from "@/lib/utils";

const POLL_MS = 5 * 60_000;
const EVENTS_SHOWN = 6;

const STATE_PILL: Record<PhoneState, string> = {
  online: "bg-ok-soft text-ok-text",
  offline: "bg-bad-soft text-bad-text",
  unknown: "bg-muted text-muted-foreground",
};
const SEGMENT: Record<PhoneState | "none", string> = {
  online: "bg-ok",
  offline: "bg-bad",
  unknown: "bg-border",
  none: "bg-border",
};

/** "3 h 35", "45 min" */
function duration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

const fraction = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h * 60 + m) / 1440;
};

/**
 * « Le téléphone d'envoi » (06/11/2026, direction A with the alert of C, maquettes
 * https://claude.ai/artifact/EoG7vfKDXPud3VyAkDtdGg): inside the « SMS aux voyageurs » card of Parking › Réglages, the
 * phone's state, a 7-day ribbon (online, offline, no check; the day-before SMS time; the SMS that did not leave), the
 * changes, and the managers' alert when it stops answering.
 */
export function SmsPhoneHistory({ readOnly }: { readOnly: boolean }) {
  const t = fr.sms.phone;
  const queryClient = useQueryClient();
  const [all, setAll] = useState(false);
  const history = useQuery({ queryKey: ["sms", "phone"], queryFn: adminApi.getSmsPhone, refetchInterval: POLL_MS });
  const alerts = useMutation({
    mutationFn: (enabled: boolean) => adminApi.setSmsPhoneAlerts(enabled),
    onSuccess: ({ alerts }) => {
      queryClient.setQueryData<PhoneHistory>(["sms", "phone"], (old) => (old ? { ...old, alerts } : old));
      toast.success(alerts ? t.alertsOn : t.alertsOff);
    },
    onError: (error) => toast.error(describeError(error)),
  });
  const h = history.data;
  if (!h) return null;

  const today = h.days[0]?.date;
  const seen = (() => {
    if (!h.now) return null;
    if (!h.now.lastSeenAt) return t.neverSeen;
    const day = h.now.lastSeenAt.slice(0, 10);
    const time = h.now.lastSeenAt.slice(11, 16);
    return day === today ? t.seenAt(time) : t.seenOn(shortDay(day), time);
  })();
  const empty = !h.now && h.events.length === 0 && h.days.every((d) => d.segments.every((s) => s.state === "none"));
  const events = all ? h.events : h.events.slice(0, EVENTS_SHOWN);

  return (
    <div data-testid="sms-phone" className="flex flex-col gap-3 border-t border-border pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-semibold">{t.title}</p>
        {h.now && (
          <span data-testid="sms-phone-state" className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", STATE_PILL[h.now.state])}>
            {t.states[h.now.state]}
          </span>
        )}
        {seen && <span className="text-sm text-muted-foreground">{seen}</span>}
      </div>
      {empty && <p className="text-sm text-muted-foreground">{t.firstCheck}</p>}

      <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{t.week}</p>
      <div className="flex flex-col gap-1.5">
        {h.days.map((day) => (
          <div
            key={day.date}
            data-testid={`sms-phone-day-${day.date}`}
            className="grid grid-cols-[52px_1fr_44px] items-center gap-2 text-xs"
          >
            <span className="text-muted-foreground">{shortDay(day.date)}</span>
            <div
              role="img"
              aria-label={`${t.dayLabel(shortDay(day.date), day.failed)} · ${day.segments
                .filter((s) => s.state !== "none")
                .map((s) => `${s.from}–${s.to} ${t.states[s.state as PhoneState]}`)
                .join(", ")}`}
              className="relative flex h-3.5 overflow-hidden rounded bg-border"
            >
              {day.segments.map((s) => (
                <span
                  key={s.from}
                  title={`${s.from}–${s.to} · ${s.state === "none" ? t.legend.none : t.states[s.state]}`}
                  className={cn("block h-full", SEGMENT[s.state])}
                  style={{ width: `${(s.end - s.start) * 100}%` }}
                />
              ))}
              {day.reminderAt && (
                <span
                  aria-hidden="true"
                  title={`${t.legend.reminder} · ${day.reminderAt}`}
                  className="absolute -top-px h-4 w-0.5 bg-foreground"
                  style={{ left: `${fraction(day.reminderAt) * 100}%` }}
                />
              )}
            </div>
            <span className="text-right font-mono text-[11px] text-bad-text" title={day.failed ? t.failed(day.failed) : undefined}>
              {day.failed ? `${day.failed} ✕` : ""}
            </span>
          </div>
        ))}
        <div className="grid grid-cols-[52px_1fr_44px] gap-2 font-mono text-[10px] text-muted-foreground" aria-hidden="true">
          <span />
          <div className="flex justify-between">
            {["00", "06", "12", "18", "24"].map((x) => (
              <span key={x}>{x}</span>
            ))}
          </div>
          <span />
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <Legend className="bg-ok" label={t.legend.online} />
        <Legend className="bg-bad" label={t.legend.offline} />
        <Legend className="bg-border" label={t.legend.none} />
        <Legend className="w-[3px] bg-foreground" label={t.legend.reminder} />
      </div>

      <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{t.changes}</p>
      {h.events.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.noChanges}</p>
      ) : (
        <ul data-testid="sms-phone-events" className="flex flex-col">
          {events.map((e, i) => (
            <PhoneEventRow key={`${e.at}-${i}`} event={e} today={today} />
          ))}
        </ul>
      )}
      {h.events.length > EVENTS_SHOWN && (
        <button type="button" onClick={() => setAll(!all)} className="self-start text-sm font-semibold text-lime-deep underline-offset-2 hover:underline">
          {all ? t.showLess : t.showAll(h.events.length)}
        </button>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={h.alerts}
          aria-label={t.alerts}
          data-testid="sms-phone-alerts"
          disabled={readOnly || alerts.isPending}
          onClick={() => alerts.mutate(!h.alerts)}
          className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50", h.alerts ? "bg-primary" : "bg-muted")}
        >
          <span
            className={cn("absolute top-1 h-5 w-5 rounded-full transition-all", h.alerts ? "right-1 bg-primary-foreground" : "left-1 bg-white shadow")}
          />
        </button>
        <span className="text-sm">{t.alerts}</span>
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <i aria-hidden="true" className={cn("inline-block h-2.5 w-2.5 rounded-sm", className)} />
      {label}
    </span>
  );
}

function PhoneEventRow({ event, today }: { event: PhoneHistory["events"][number]; today?: string }) {
  const t = fr.sms.phone.events;
  const kinds = fr.sms.phone.kinds;
  const day = event.at.slice(0, 10);
  let tone: string;
  let title: string;
  let detail: string;
  if (event.kind === "state") {
    tone = event.state === "online" ? "bg-ok" : event.state === "offline" ? "bg-bad" : "bg-border";
    if (event.state === "offline") {
      title = t.offline;
      detail = event.lastSeenAt ? t.offlineSince(event.lastSeenAt.slice(11, 16)) : t.offlineNever;
    } else if (event.state === "online") {
      title = t.online;
      detail = event.afterMinutes !== null ? t.onlineAfter(duration(event.afterMinutes)) : "";
    } else {
      title = t.unknown;
      detail = t.unknownDetail;
    }
  } else {
    tone = "bg-bad";
    const what = kinds[event.smsKind] ?? kinds.other;
    title = event.status === "abandoned" ? t.abandoned(event.count, what) : t.refused(event.count, what);
    detail = event.status === "abandoned" ? t.abandonedDetail : t.refusedDetail;
  }
  return (
    <li className="grid grid-cols-[60px_12px_1fr] items-start gap-2 border-t border-border py-2 text-sm first:border-t-0">
      <span className="font-mono text-xs text-muted-foreground">
        {day !== today && <span className="block font-sans">{shortDay(day)}</span>}
        {event.at.slice(11, 16)}
      </span>
      <i aria-hidden="true" className={cn("mt-1.5 h-2.5 w-2.5 rounded-full", tone)} />
      <span className="min-w-0">
        {title}
        {detail && <span className="block text-xs text-muted-foreground">{detail}</span>}
      </span>
    </li>
  );
}
