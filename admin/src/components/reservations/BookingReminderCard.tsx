import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-context";
import { adminApi } from "@/lib/api";
import { addDays, shortDay, todayLocal } from "@/lib/datetime";
import { bookingReminderFr as t, describeError, remindersFr } from "@/lib/fr";
import type { BookingReminder } from "@/lib/types";

/** "ce soir à 18:00", "demain à 18:00", "sam. 4 à 18:00", from a local "YYYY-MM-DDTHH:mm". */
// eslint-disable-next-line react-refresh/only-export-components
export function whenOf(local: string, timeZone: string, evening = false): string {
  const day = local.slice(0, 10);
  const time = local.slice(11, 16);
  const today = todayLocal(timeZone);
  const label =
    day === today
      ? evening && time >= "17:00"
        ? t.tonight
        : t.today
      : day === addDays(today, 1)
        ? t.tomorrow
        : shortDay(day);
  return t.at(label, time);
}

function statusLine(r: BookingReminder): string {
  if (r.sentAt) return t.sent(whenOf(r.sentAt, r.timezone));
  if (r.status === "planned" && r.at) return t.planned(whenOf(r.at, r.timezone, true));
  const s = remindersFr.status;
  switch (r.status) {
    case "excluded":
      return s.excluded(null);
    case "waiting":
    case "failed":
    case "disabled":
    case "no_mobile":
    case "foreign":
    case "no_channel":
    case "paused":
    case "same_day":
    case "too_late":
      return s[r.status];
    default:
      return t.notYet;
  }
}

/**
 * « SMS de la veille » of one booking (30/10/2026, « pouvoir envoyer un SMS de la veille à une réservation donnée »,
 * choice A): when it leaves or left, and « Envoyer maintenant » / « Renvoyer le SMS » (confirmed; the SMS alone, 10
 * minutes after the last one at the earliest, at any hour since 31/10/2026). For a booking still to come or already
 * reminded; for those who manage the bookings.
 */
export function BookingReminderCard({ reservationId }: { reservationId: string }) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const key = ["booking-reminder", reservationId];
  const query = useQuery({ queryKey: key, queryFn: () => adminApi.getBookingReminder(reservationId) });
  const send = useMutation({
    mutationFn: (_again: boolean) => adminApi.sendBookingReminder(reservationId),
    onSuccess: (data, again) => {
      queryClient.setQueryData(key, data);
      queryClient.invalidateQueries({ queryKey: ["reservation-history", reservationId] });
      queryClient.invalidateQueries({ queryKey: ["reservation-messages", reservationId] });
      const words = data.whatsapp ? t.whatsapp : t;
      if (data.status === "failed") toast.error(words.failed);
      else toast.success(again ? words.doneAgain : words.done);
    },
    onError: (err: Error) => toast.error(describeError(err, t.refusal)),
  });
  const r = query.data;
  // Nothing to say once the stay started without a reminder, nor for a booking made on the day.
  if (!r || (r.refusal === "reminder_not_upcoming" && !r.sentAt)) return null;

  // 10/11/2026 (choice A): with WhatsApp on, the card and its button say the channel the message takes first.
  const wa = !!r.whatsapp;
  const words = wa ? { ...t, ...t.whatsapp } : t;
  const Icon = wa ? MessageCircle : MessageSquareText;

  const onSend = async () => {
    if (r.resend) {
      const ok = await confirm(words.confirmText(whenOf(r.sentAt!, r.timezone)), {
        title: words.confirmTitle,
        confirmLabel: t.confirm,
      });
      if (!ok) return;
    }
    send.mutate(r.resend);
  };

  return (
    <section
      data-testid="booking-reminder"
      aria-labelledby="booking-reminder-title"
      className="flex flex-wrap items-center gap-3 rounded-xl border border-panel-line bg-white p-4"
    >
      <Icon className="h-5 w-5 shrink-0 text-lime-deep" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <h2 id="booking-reminder-title" className="text-sm font-semibold">
          {words.title}
        </h2>
        <p className="text-sm text-muted-foreground" data-testid="booking-reminder-status">
          {statusLine(r)}
        </p>
        {r.refusal && r.refusal !== "reminder_not_upcoming" && (
          <p className="mt-0.5 text-xs text-muted-foreground" data-testid="booking-reminder-refusal">
            {t.refusal[r.refusal]}
          </p>
        )}
      </div>
      {r.refusal !== "reminder_not_upcoming" && (
        <div className="flex flex-col items-end gap-1">
          <Button
            type="button"
            variant={r.resend ? "outline" : "default"}
            disabled={!r.canSend || send.isPending}
            onClick={onSend}
            data-testid="booking-reminder-send"
          >
            {wa && <MessageCircle className="mr-1.5 h-4 w-4" aria-hidden="true" />}
            {send.isPending ? t.sending : r.resend ? words.resend : words.send}
          </Button>
          {wa && (
            <p className="text-xs text-muted-foreground" data-testid="booking-reminder-fallback">
              {t.whatsapp.fallback}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
