import { MessageCircle, MessageSquareText } from "lucide-react";
import { bookingReminderFr } from "@/lib/fr";
import type { ReminderDelivery } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = bookingReminderFr.delivery;

/**
 * 10/11/2026 (« distingue WhatsApp et SMS »): how a day-before message reached the traveller. WhatsApp in green with the
 * double tick once read; SMS in grey, « WhatsApp non remis » when it went in WhatsApp's place.
 */
export function DeliveryPill({ delivery, className }: { delivery: ReminderDelivery; className?: string }) {
  const wa = delivery.by === "whatsapp";
  const Icon = wa ? MessageCircle : MessageSquareText;
  const time = delivery.statusAt?.slice(11, 16) ?? null;
  const detail = wa
    ? delivery.status === "read"
      ? t.read(time)
      : delivery.status === "delivered"
        ? t.delivered
        : delivery.status === "failed"
          ? t.notDelivered
          : null
    : delivery.whatsappFallback
      ? t.fallback
      : null;
  return (
    <span
      data-testid="delivery-pill"
      data-by={delivery.by}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold",
        wa ? "bg-[#DCFCE7] text-[#166534]" : "bg-panel-2 text-muted-foreground",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {wa ? t.whatsapp : t.sms}
      {detail && <span className="font-normal">· {detail}</span>}
    </span>
  );
}
