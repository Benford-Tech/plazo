import { bookingReminderFr } from "@/lib/fr";
import type { ReminderProof } from "@/lib/types";

/** 11/11/2026 (direction A): the words of a message's proof. */
const p = bookingReminderFr.delivery.proof;
const hhmm = (local: string | null) => local?.slice(11, 16) ?? null;

/** The headline: what was confirmed, else that it left without a confirmation, else that it failed. */
export function proofLabel(proof: ReminderProof): string {
  const { whatsapp: wa, sms } = proof;
  if (proof.level === "confirmed") {
    if (wa?.state === "read") return p.read(hhmm(wa.statusAt));
    if (wa?.state === "delivered") return p.delivered(hhmm(wa.statusAt));
    return p.smsDelivered(hhmm(sms?.statusAt ?? null));
  }
  if (proof.level === "pending") return p.pending;
  if (proof.level === "failed") return p.failed;
  return wa?.state === "accepted" ? p.accepted : p.smsSent;
}

/** The line under it: each channel and its time. */
export function proofDetail(proof: ReminderProof): string {
  const { whatsapp: wa, sms } = proof;
  const parts: string[] = [];
  if (wa) {
    const at = hhmm(wa.at) ?? "";
    if (wa.state === "accepted") parts.push(p.detail.waAccepted(at));
    else if (wa.state === "refused") parts.push(p.detail.waRefused(at));
    else if (!sms) parts.push(p.detail.waDelivered);
  }
  if (sms) {
    const at = hhmm(sms.at) ?? "";
    if (sms.state === "delivered") parts.push(p.detail.smsDelivered(hhmm(sms.statusAt)));
    else if (sms.state === "sent") parts.push(wa ? p.detail.smsSent(at) : p.detail.smsSentAlone(at));
    else if (sms.state === "queued") parts.push(p.detail.smsQueued);
    else parts.push(p.detail.smsFailed);
  }
  return parts.join(" · ");
}

