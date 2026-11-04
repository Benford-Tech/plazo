import { useQuery } from "@tanstack/react-query";
import { Badge, type BadgeTone } from "@/components/dashboard/Badge";
import { adminApi } from "@/lib/api";
import { dateTimeShort, PARKING_TZ } from "@/lib/datetime";
import { travellerMessagesFr as t } from "@/lib/fr";
import type { TravellerMessage } from "@/lib/types";

const time = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: PARKING_TZ }).format(new Date(iso))
    : null;

function statusOf(message: TravellerMessage): { text: string; tone: "ok" | "warn" | "bad" | "muted" } {
  const at = time(message.statusAt);
  if (message.channel === "whatsapp") {
    const s = t.status.whatsapp;
    if (message.status === "read") return { text: s.read(at), tone: "ok" };
    if (message.status === "delivered") return { text: s.delivered(at), tone: "muted" };
    if (message.status === "failed") return { text: s.failed, tone: "bad" };
    return { text: s.sent, tone: "muted" };
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
  if (messages.length === 0) return null;
  return (
    <section
      data-testid="traveller-messages"
      aria-labelledby="traveller-messages-title"
      className="rounded-xl border border-panel-line bg-white p-4"
    >
      <h2 id="traveller-messages-title" className="text-base font-semibold">
        {t.title(messages.length)}
      </h2>
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
                {message.whatsappFallback && <span className="block text-xs text-muted-foreground">{t.fallback}</span>}
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
