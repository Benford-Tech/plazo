import { MessageCircle, MessageSquareText } from "lucide-react";
import { bookingReminderFr } from "@/lib/fr";
import type { ReminderDelivery, ReminderProof } from "@/lib/types";
import { proofDetail, proofLabel } from "@/lib/delivery-proof";
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

const PROOF_TONE: Record<ReminderProof["level"], string> = {
  confirmed: "bg-ok-soft text-ok-text",
  unconfirmed: "bg-warn-soft text-warn-text",
  pending: "bg-warn-soft text-warn-text",
  failed: "bg-bad-soft text-bad-text",
};

/**
 * 11/11/2026 (« un status des envois réaliste », direction A): one pill with the level of proof, the channels underneath.
 * « Remis » and « Lu » only on Meta's or the network's confirmation; otherwise « pas de confirmation ».
 */
export function DeliveryProof({ proof, className }: { proof: ReminderProof; className?: string }) {
  const detail = proofDetail(proof);
  return (
    <span className={cn("inline-flex flex-col gap-0.5", className)}>
      <span
        data-testid="delivery-proof"
        data-level={proof.level}
        className={cn("inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", PROOF_TONE[proof.level])}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
        {proofLabel(proof)}
      </span>
      {detail && <span className="text-xs text-muted-foreground">{detail}</span>}
    </span>
  );
}
