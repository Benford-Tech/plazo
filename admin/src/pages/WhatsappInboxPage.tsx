import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Mic, Paperclip, Phone } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { StatusPill } from "@/components/StatusPill";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError, adminApi } from "@/lib/api";
import { PARKING_TZ, dateTimeShort, timeOf, todayLocal } from "@/lib/datetime";
import {
  describeError,
  travellerMessagesFr,
  whatsappInboxFr as t,
} from "@/lib/fr";
import type {
  WhatsappConversation,
  WhatsappConversationDetail,
  WhatsappInboxMessage,
  WhatsappInboxView,
  WhatsappSentMessage,
} from "@/lib/types";
import { cn } from "@/lib/utils";

/** « Envoyés » (12/11/2026, « Affiche aussi les messages envoyés »): what Plazo sent, beside the conversations. */
type PageView = WhatsappInboxView | "sent";
const VIEWS: PageView[] = ["unread", "all", "handled", "sent", "unknown"];
const viewOf = (raw: string | null): PageView =>
  VIEWS.includes(raw as PageView) ? (raw as PageView) : "unread";

const dayOf = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: PARKING_TZ }).format(
    new Date(iso),
  );
const dayLabel = (iso: string) => {
  const day = dayOf(iso);
  const today = todayLocal();
  if (day === today) return t.today;
  const yesterday = new Date(`${today}T12:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  if (day === yesterday.toISOString().slice(0, 10)) return t.yesterday;
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: PARKING_TZ,
  }).format(new Date(iso));
};
const listTime = (iso: string) =>
  dayOf(iso) === todayLocal() ? timeOf(iso) : dayLabel(iso);

type ChatItem =
  | { kind: "message"; at: string; message: WhatsappInboxMessage }
  | {
      kind: "sent";
      at: string;
      id: string;
      label: string;
      status: string;
      text: string | null;
    };

function chatItems(detail: WhatsappConversationDetail): ChatItem[] {
  const items: ChatItem[] = [
    ...detail.messages.map((message) => ({
      kind: "message" as const,
      at: message.at,
      message,
    })),
    ...detail.sent.map((s) => ({
      kind: "sent" as const,
      at: s.at,
      id: s.id,
      label: t.sentByPlazo(
        travellerMessagesFr.kind[s.kind] ?? travellerMessagesFr.otherKind,
      ),
      status: t.sentStatus[s.status] ?? s.status,
      text: s.text ?? null,
    })),
  ];
  return items.sort((a, b) => a.at.localeCompare(b.at));
}

/** A photo or voice note: fetched through Plazo on demand (never a public link). */
function MediaButton({ message }: { message: WhatsappInboxMessage }) {
  const [state, setState] = useState<"idle" | "loading" | "gone">("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  useEffect(
    () => () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    },
    [audioUrl],
  );
  if (audioUrl)
    return (
      <audio
        controls
        src={audioUrl}
        className="mt-1 max-w-full"
        data-testid="wa-audio"
      />
    );
  const open = async () => {
    setState("loading");
    try {
      const blob = await adminApi.whatsappMedia(message.id);
      const url = URL.createObjectURL(blob);
      if (message.type === "audio") setAudioUrl(url);
      else window.open(url, "_blank", "noopener");
      setState("idle");
    } catch {
      setState("gone");
    }
  };
  const Icon = message.type === "audio" ? Mic : Paperclip;
  if (state === "gone")
    return (
      <span className="mt-1 block text-xs text-muted-foreground">
        {t.mediaGone}
      </span>
    );
  return (
    <button
      type="button"
      onClick={open}
      className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-lime-deep underline"
    >
      <Icon className="h-3.5 w-3.5" />
      {state === "loading"
        ? t.mediaLoading
        : (t.media[message.type] ?? t.media.document)}
    </button>
  );
}

function Bubble({ item }: { item: ChatItem }) {
  if (item.kind === "sent")
    return (
      <div
        data-testid="wa-sent"
        className="max-w-[78%] self-end rounded-xl bg-[#DCF8C6] px-3 py-1.5 text-xs text-[#0B3B19] opacity-90"
      >
        <span className="font-semibold">{item.label}</span>
        {item.text && (
          <span className="mt-1 block whitespace-pre-wrap break-words text-sm">
            {item.text}
          </span>
        )}
        <span className="tabular mt-0.5 block text-right font-mono text-[11px] text-[#3F6B4A]">
          {timeOf(item.at)} · {item.status}
        </span>
      </div>
    );
  const m = item.message;
  const out = m.direction === "out";
  return (
    <div
      data-testid={out ? "wa-out" : "wa-in"}
      className={cn(
        "max-w-[78%] whitespace-pre-wrap break-words rounded-xl px-3 py-1.5 text-sm",
        out
          ? "self-end bg-[#DCF8C6] text-[#0B3B19]"
          : "self-start bg-white text-foreground",
      )}
    >
      {out && m.by && (
        <span className="block text-[11px] font-semibold text-lime-deep">
          {m.by.firstName}
        </span>
      )}
      {m.type === "location" && (
        <span className="flex items-center gap-1 text-xs font-semibold">
          <MapPin className="h-3.5 w-3.5" />
          {t.location}
        </span>
      )}
      {m.type === "location" && m.text ? (
        <a
          className="underline"
          href={`https://www.google.com/maps?q=${encodeURIComponent(m.text)}`}
          target="_blank"
          rel="noreferrer"
        >
          {m.text}
        </a>
      ) : (
        m.text
      )}
      {m.hasMedia && <MediaButton message={m} />}
      <span
        className={cn(
          "tabular mt-0.5 block text-right font-mono text-[11px]",
          out ? "text-[#3F6B4A]" : "text-muted-foreground",
        )}
      >
        {timeOf(m.at)}
        {out && m.status ? ` · ${t.replyStatus[m.status] ?? m.status}` : ""}
      </span>
    </div>
  );
}

function AttachForm({ id, onDone }: { id: string; onDone: () => void }) {
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const attach = useMutation({
    mutationFn: () => adminApi.attachWhatsapp(id, reference),
    onSuccess: (res) => {
      toast.success(t.attached(res.reservation.reference));
      onDone();
    },
    onError: (err) => {
      const field = err instanceof ApiError ? err.fields?.reference : undefined;
      setError(
        field ? (t.fieldErrors[field] ?? field) : describeError(err, t.errors),
      );
    },
  });
  return (
    <form
      data-testid="wa-attach"
      className="flex flex-col gap-2 border-t border-panel-line px-4 py-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        attach.mutate();
      }}
    >
      <label htmlFor="wa-attach-ref" className="text-sm font-semibold">
        {t.attachTitle}
      </label>
      <div className="flex gap-2">
        <input
          id="wa-attach-ref"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-panel-line bg-white px-3 py-2 font-mono text-sm"
          placeholder="R7KQ2M"
        />
        <button
          type="submit"
          disabled={attach.isPending}
          className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
        >
          {t.attach}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">{error ?? t.attachHint}</p>
    </form>
  );
}

function Thread({
  id,
  onBack,
  onChanged,
}: {
  id: string;
  onBack: () => void;
  onChanged: () => void;
}) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["whatsapp-conversation", id],
    queryFn: () => adminApi.whatsappConversation(id),
    refetchInterval: 10_000,
  });
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const detail = query.data;
  const items = useMemo(() => (detail ? chatItems(detail) : []), [detail]);
  useEffect(() => {
    end.current?.scrollIntoView?.({ block: "end" });
  }, [items.length]);
  useEffect(() => {
    if (detail) queryClient.invalidateQueries({ queryKey: ["nav-counts"] });
  }, [detail?.conversation.id, queryClient]); // eslint-disable-line react-hooks/exhaustive-deps

  const reply = useMutation({
    mutationFn: () => adminApi.replyWhatsapp(id, text),
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({
        queryKey: ["whatsapp-conversation", id],
      });
      onChanged();
    },
    onError: (err) => toast.error(describeError(err, t.errors)),
  });
  const handle = useMutation({
    mutationFn: (handled: boolean) => adminApi.handleWhatsapp(id, handled),
    onSuccess: (conv) => {
      if (conv.handledAt) toast.success(t.handled);
      queryClient.invalidateQueries({
        queryKey: ["whatsapp-conversation", id],
      });
      onChanged();
    },
    onError: (err) => toast.error(describeError(err, t.errors)),
  });

  if (query.isError)
    return (
      <p className="p-4 text-sm text-destructive">
        {describeError(query.error, t.errors)}
      </p>
    );
  if (!detail)
    return (
      <p className="p-4 text-sm text-muted-foreground">{t.mediaLoading}</p>
    );
  const c = detail.conversation;
  const r = c.reservation;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim()) reply.mutate();
  };
  let lastDay = "";
  return (
    <div className="flex min-w-0 flex-col" data-testid="wa-thread">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-panel-line px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label={t.back}
          className="-ml-1 rounded-md p-1 hover:bg-accent md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <b className="text-base">{c.name ?? c.phone}</b>
        {r && (
          <span className="rounded-full border border-panel-line px-2 py-0.5 font-mono text-xs">
            {r.externalReference ?? r.reference}
          </span>
        )}
        {r && <StatusPill status={r.status} />}
        <a
          href={`tel:${c.phone.replace(/\s/g, "")}`}
          className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground"
        >
          <Phone className="h-3.5 w-3.5" />
          {c.phone}
        </a>
        {r && (
          <Link
            to={`/reservations/${r.id}`}
            className="ml-auto text-sm font-semibold text-lime-deep"
          >
            {t.openBooking}
          </Link>
        )}
      </div>
      <div className="flex min-h-[320px] flex-col gap-2 bg-[#EFEAE2] p-4">
        {items.map((item) => {
          const day = dayOf(item.at);
          const separator = day !== lastDay;
          lastDay = day;
          return (
            <div
              key={item.kind === "sent" ? `s-${item.id}` : item.message.id}
              className="flex flex-col gap-2"
            >
              {separator && (
                <span className="self-center rounded-full bg-white px-2.5 py-0.5 text-[11px] text-muted-foreground">
                  {dayLabel(item.at)}
                </span>
              )}
              <Bubble item={item} />
            </div>
          );
        })}
        <div ref={end} />
      </div>
      {c.unknown && <UnknownAttach id={id} onDone={onChanged} />}
      <form
        onSubmit={submit}
        className="flex flex-col gap-2 border-t border-panel-line px-4 py-3"
      >
        {c.replyUntil ? (
          <span
            className="text-xs font-semibold text-lime-deep"
            data-testid="wa-window"
          >
            {t.replyUntil(dateTimeShort(c.replyUntil))}
          </span>
        ) : (
          <span
            className="text-xs font-semibold text-warn-text"
            data-testid="wa-window-closed"
          >
            {t.windowClosed}
          </span>
        )}
        <div className="flex gap-2">
          <textarea
            aria-label={t.placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (text.trim() && c.replyUntil) reply.mutate();
              }
            }}
            disabled={!c.replyUntil}
            rows={2}
            maxLength={4096}
            placeholder={t.placeholder}
            className="min-w-0 flex-1 resize-y rounded-lg border border-panel-line bg-white px-3 py-2 text-sm disabled:bg-panel-2"
          />
          {c.replyUntil ? (
            <button
              type="submit"
              disabled={!text.trim() || reply.isPending}
              className="self-end rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              {reply.isPending ? t.sending : t.send}
            </button>
          ) : (
            <a
              href={`tel:${c.phone.replace(/\s/g, "")}`}
              className="self-end rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
            >
              {t.call(c.phone)}
            </a>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handle.mutate(!c.handledAt)}
            disabled={handle.isPending}
            className="rounded-full border border-panel-line px-3 py-1.5 text-sm font-semibold hover:bg-accent"
          >
            {c.handledAt ? t.unhandle : t.handle}
          </button>
        </div>
      </form>
    </div>
  );
}

/** « Numéro inconnu » (platform admins): attach to a booking by its reference. */
function UnknownAttach({ id, onDone }: { id: string; onDone: () => void }) {
  const { user } = useAuth();
  if (!user?.isPlatformAdmin) return null;
  return <AttachForm id={id} onDone={onDone} />;
}

function ConversationRow({
  c,
  selected,
  onSelect,
}: {
  c: WhatsappConversation;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      data-testid={`wa-conv-${c.id}`}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "grid w-full grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-0.5 border-b border-panel-line px-4 py-2.5 text-left hover:bg-panel-2",
        selected && "bg-panel-2 shadow-[inset_3px_0_0_#1E5E2E]",
      )}
    >
      <b
        className={cn("truncate", c.unread > 0 ? "font-bold" : "font-semibold")}
      >
        {c.name ?? c.phone}
      </b>
      <span className="tabular flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
        {listTime(c.lastMessageAt)}
        {c.unread > 0 && (
          <span className="min-w-[18px] rounded-full bg-lime-deep px-1.5 text-center text-[11px] font-semibold leading-[18px] text-white">
            {c.unread}
          </span>
        )}
      </span>
      <span className="col-span-2 truncate text-xs text-muted-foreground">
        {c.reservation
          ? (c.reservation.externalReference ?? c.reservation.reference)
          : t.unknownNumber}
        {c.reservation && ` · ${dateTimeShort(c.reservation.arrivalAt)}`}
      </span>
      {c.preview && (
        <span className="col-span-2 truncate text-sm text-muted-foreground">
          {c.preview.direction === "out" ? `${t.you} : ` : ""}
          {c.preview.text}
        </span>
      )}
    </button>
  );
}

function SentCard({
  m,
  onConversation,
}: {
  m: WhatsappSentMessage;
  onConversation: (id: string) => void;
}) {
  const r = m.reservation;
  return (
    <div
      data-testid={`wa-sent-${m.id}`}
      className="space-y-1.5 border-b border-panel-line px-4 py-3"
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <b className="text-sm">
          {travellerMessagesFr.kind[m.kind] ?? travellerMessagesFr.otherKind}
        </b>
        <span className="text-sm">{r ? r.customerName : m.phone}</span>
        <span className="text-xs text-muted-foreground">
          {r
            ? `${r.externalReference ?? r.reference} · ${m.phone}`
            : t.unknownNumber}
        </span>
        <span className="tabular ml-auto font-mono text-xs text-muted-foreground">
          {listTime(m.at)}
          {dayOf(m.at) === todayLocal() ? "" : ` ${timeOf(m.at)}`}
        </span>
      </div>
      <div className="max-w-2xl whitespace-pre-wrap break-words rounded-xl bg-[#DCF8C6] px-3 py-2 text-sm text-[#0B3B19]">
        {m.text ?? <span className="italic opacity-80">{t.sentNoText}</span>}
        <span className="tabular mt-0.5 block text-right font-mono text-[11px] text-[#3F6B4A]">
          {t.sentStatus[m.status] ?? m.status}
          {m.smsFallback && m.status !== "fallback"
            ? ` · ${t.sentSmsFallback}`
            : ""}
        </span>
      </div>
      <div className="flex flex-wrap gap-4 text-sm font-semibold text-lime-deep">
        {m.conversationId && (
          <button
            type="button"
            onClick={() => onConversation(m.conversationId!)}
          >
            {t.openConversation}
          </button>
        )}
        {r && <Link to={`/reservations/${r.id}`}>{t.openBooking}</Link>}
      </div>
    </div>
  );
}

function SentList({
  onConversation,
}: {
  onConversation: (id: string) => void;
}) {
  const query = useQuery({
    queryKey: ["whatsapp-sent"],
    queryFn: () => adminApi.whatsappSent(),
    refetchInterval: 30_000,
  });
  const rows = query.data?.data ?? [];
  return (
    <div data-testid="wa-sent-list">
      <p className="px-4 pt-3 text-sm text-muted-foreground">{t.sentIntro}</p>
      {query.isError && (
        <p className="p-4 text-sm text-destructive">{t.failed}</p>
      )}
      {query.data && rows.length === 0 && (
        <p className="p-4 text-sm text-muted-foreground">{t.empty.sent}</p>
      )}
      {rows.map((m) => (
        <SentCard key={m.id} m={m} onConversation={onConversation} />
      ))}
    </div>
  );
}

/**
 * « Messages WhatsApp » (12/11/2026, « une boîte de réception des messages envoyés par WhatsApp », direction A of
 * https://claude.ai/artifact/E2oye5And3wLVphw6rE5ko): the conversations on the left, the chosen one on the right with
 * what Plazo sent this booking, and a free reply within Meta's 24 hours. On a phone, the list, then the conversation.
 */
export default function WhatsappInboxPage() {
  const [params, setParams] = useSearchParams();
  const view = viewOf(params.get("vue"));
  const selectedId = params.get("c");
  const queryClient = useQueryClient();
  const listView: WhatsappInboxView = view === "sent" ? "all" : view;
  const list = useQuery({
    queryKey: ["whatsapp-inbox", listView],
    queryFn: () => adminApi.whatsappInbox(listView),
    refetchInterval: 15_000,
  });
  const counts = list.data?.counts;
  const rows = list.data?.data ?? [];
  const select = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set("c", id);
    else next.delete("c");
    setParams(next, { replace: !id });
  };
  const changeView = (v: PageView) => {
    const next = new URLSearchParams();
    if (v !== "unread") next.set("vue", v);
    setParams(next);
  };
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["whatsapp-inbox"] });
    queryClient.invalidateQueries({ queryKey: ["nav-counts"] });
  };
  const views = VIEWS.filter(
    (v) => v !== "unknown" || (counts?.unknown ?? null) !== null,
  );
  const countOf = (v: PageView) => (counts ? counts[v] : null);
  const openConversation = (id: string) =>
    setParams(new URLSearchParams({ vue: "all", c: id }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.intro}</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-panel-line bg-white">
        <div
          className="flex flex-wrap gap-1.5 border-b border-panel-line px-4 py-3"
          role="tablist"
        >
          {views.map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={v === view}
              data-testid={`wa-view-${v}`}
              onClick={() => changeView(v)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold",
                v === view
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-panel-line text-muted-foreground hover:bg-panel-2",
              )}
            >
              {t.views[v]}
              {countOf(v) !== null && countOf(v) !== undefined
                ? ` · ${countOf(v)}`
                : ""}
            </button>
          ))}
        </div>
        {view === "sent" ? (
          <SentList onConversation={openConversation} />
        ) : (
          <>
            {list.isError && (
              <p className="p-4 text-sm text-destructive">{t.failed}</p>
            )}
            <div className="grid md:grid-cols-[340px_minmax(0,1fr)]">
              <div
                className={cn(
                  "min-w-0 md:border-r md:border-panel-line",
                  selectedId && "hidden md:block",
                )}
              >
                {list.data && rows.length === 0 && (
                  <p className="p-4 text-sm text-muted-foreground">
                    {t.empty[view]}
                  </p>
                )}
                {rows.map((c) => (
                  <ConversationRow
                    key={c.id}
                    c={c}
                    selected={c.id === selectedId}
                    onSelect={() => select(c.id)}
                  />
                ))}
              </div>
              <div className={cn("min-w-0", !selectedId && "hidden md:block")}>
                {selectedId ? (
                  <Thread
                    key={selectedId}
                    id={selectedId}
                    onBack={() => select(null)}
                    onChanged={refresh}
                  />
                ) : (
                  <p className="p-6 text-sm text-muted-foreground">{t.pick}</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
