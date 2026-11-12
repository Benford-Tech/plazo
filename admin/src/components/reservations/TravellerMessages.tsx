import { useQuery } from "@tanstack/react-query";
import { Badge, type BadgeTone } from "@/components/dashboard/Badge";
import { adminApi } from "@/lib/api";
import { dateTimeShort, PARKING_TZ } from "@/lib/datetime";
import { travellerMessagesFr as t } from "@/lib/fr";
import { Link } from "react-router-dom";
import type { ReservationConversation, TravellerMessage } from "@/lib/types";

const time = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: PARKING_TZ }).format(new Date(iso))
    : null;

function statusOf(message: TravellerMessage): { text: string; tone: "ok" | "warn" | "bad" | "muted" } {
  const at = time(message.statusAt);
  if (message.channel === "whatsapp") {
    const s = t.status.whatsapp;
    if (message.status === "read") return { text: s.read(at), tone: "ok" };
    if (message.status === "delivered") return { text: s.delivered(at), tone: "ok" };
    if (message.status === "failed") return { text: s.failed, tone: "bad" };
    return { text: s.sent, tone: "warn" };
  }
  const s = t.status.sms;
  if (message.status === "delivered") return { text: s.delivered(at), tone: "ok" };
  if (message.status === "sent") return { text: s.sent(at), tone: "muted" };
  if (message.status === "queued") return { text: s.queued, tone: "warn" };
  if (message.status === "failed") return { text: s.failed, tone: "warn" };
  return { text: s.abandoned, tone: "bad" };
}

const TONE_CLASS = { ok: "text-ok-text", warn: "text-warn-text", bad: "text-bad-text", muted: "text-muted-foreground" };
const CHANNEL_TONE: Record<TravellerMessage["channel"], BadgeTone> = { whatsapp: "ok", sms: "info" };

/** 12/11/2026: what the traveller wrote back on WhatsApp, and the team's replies (« Messages WhatsApp »). */
function ConversationLines({ conversation }: { conversation: ReservationConversation }) {
  return (
    <div data-testid="traveller-conversation" className="mt-2 rounded-lg bg-panel-2 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">
          {t.conversation}
          {conversation.unread > 0 && <span className="ml-1.5 rounded-full bg-lime-deep px-1.5 text-[11px] text-white">{conversation.unread}</span>}
        </span>
        <Link to={`/reservations/whatsapp?vue=all&c=${conversation.id}`} className="text-sm font-semibold text-lime-deep">
          {t.openConversation}
        </Link>
      </div>
      <ul className="mt-1.5 space-y-1">
        {conversation.messages.slice(0, 4).map((m) => (
          <li key={m.id} className="flex gap-2 text-sm">
            <span className="tabular w-24 shrink-0 font-mono text-xs text-muted-foreground">{dateTimeShort(m.at)}</span>
            <span className="min-w-0 flex-1 truncate">« {m.text} »</span>
            <span className="shrink-0 text-xs text-muted-foreground">{m.direction === "in" ? t.received : (m.by?.firstName ?? t.team)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * « Messages au voyageur » (04/11/2026, « Ajoute la liste des messages sur la fiche réservation », the « Fiche réservation :
 * messages envoyés » screen of the WhatsApp mockups): each SMS or WhatsApp message sent to the traveller, newest first,
 * with its channel and its fate; a WhatsApp message that fell back to SMS is the SMS line. Hidden while nothing was sent.
 */
export function TravellerMessages({ reservationId }: { reservationId: string }) {
  const query = useQuery({
    queryKey: ["reservation-messages", reservationId],
    queryFn: () => adminApi.getReservationMessages(reservationId),
  });
  const messages = query.data?.data ?? [];
  const conversation = query.data?.conversation ?? null;
  if (messages.length === 0 && !conversation) return null;
  return (
    <section
      data-testid="traveller-messages"
      aria-labelledby="traveller-messages-title"
      className="rounded-xl border border-panel-line bg-white p-4"
    >
      <h2 id="traveller-messages-title" className="text-base font-semibold">
        {t.title(messages.length + (conversation?.messages.length ?? 0))}
      </h2>
      {conversation && <ConversationLines conversation={conversation} />}
      <ul className="mt-2 divide-y divide-panel-line">
        {messages.map((message) => {
          const status = statusOf(message);
          return (
            <li
              key={message.id}
              data-testid="traveller-message"
              data-channel={message.channel}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm"
            >
              <span className="tabular w-32 shrink-0 font-mono text-xs text-muted-foreground">{dateTimeShort(message.at)}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{t.kind[message.kind] ?? t.otherKind}</span>
                {message.whatsappFallback && <span className="block text-xs text-muted-foreground">{message.whatsappSilent ? t.fallbackSilent : t.fallback}</span>}
              </span>
              <Badge tone={CHANNEL_TONE[message.channel]} className="shrink-0">
                {t.channel[message.channel]}
              </Badge>
              <span className={`w-36 shrink-0 text-right ${TONE_CLASS[status.tone]}`}>{status.text}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">{t.retention}</p>
    </section>
  );
}
